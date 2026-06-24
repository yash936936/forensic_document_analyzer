"""
Document Denoising Utility
--------------------------
Wraps the trained Keras convolutional autoencoder from train_model.ipynb.

The model was trained on 32×32 grayscale patches from:
  - train/          (noisy/degraded documents)
  - train_cleaned/  (clean ground truth)

Integration:
  - Call `load_denoiser()` once at startup (stored in app state).
  - Call `denoise_image(image_path, model)` per request.
"""

import os
import uuid
import logging
import numpy as np
import cv2

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model definition — mirrors train_model.ipynb exactly
# ---------------------------------------------------------------------------

def build_denoiser_model():
    """
    Reconstructs the same architecture that was trained in the notebook.
    Call this only to retrain. For inference, load the saved .keras file.
    """
    from keras.models import Model
    from keras.layers import Conv2D, MaxPooling2D, UpSampling2D, Input

    inp = Input(shape=(32, 32, 1))
    x = Conv2D(64, (3, 3), activation="relu", padding="same")(inp)
    x = MaxPooling2D((2, 2), padding="same")(x)
    x = Conv2D(32, (3, 3), activation="relu", padding="same")(x)
    x = MaxPooling2D((2, 2), padding="same")(x)

    x = Conv2D(32, (3, 3), activation="relu", padding="same")(x)
    x = UpSampling2D((2, 2))(x)
    x = Conv2D(64, (3, 3), activation="relu", padding="same")(x)
    x = UpSampling2D((2, 2))(x)
    out = Conv2D(1, (3, 3), activation="sigmoid", padding="same")(x)

    model = Model(inp, out)
    model.compile(optimizer="adam", loss="binary_crossentropy")
    return model


# ---------------------------------------------------------------------------
# Chunk helpers (ported directly from train_model.ipynb)
# ---------------------------------------------------------------------------

def _get_chunks(page: np.ndarray) -> np.ndarray:
    """
    Slices a grayscale image (H×W float32 0-1) into a grid of 32×32 patches.
    Rows/cols that don't divide evenly are cropped (same behaviour as notebook).
    Returns ndarray of shape (row_chunks, col_chunks, 32, 32, 1).
    """
    oph, opw = page.shape[:2]
    nph, npw = oph - (oph % 32), opw - (opw % 32)
    row_chunks = nph // 32
    col_chunks = npw // 32

    img_chunks = np.ones((row_chunks, col_chunks, 32, 32, 1), dtype="float32")
    rc = 0
    for row in range(0, nph, 32):
        cc = 0
        for col in range(0, npw, 32):
            patch = page[row:row + 32, col:col + 32]
            img_chunks[rc, cc] = patch.reshape(32, 32, 1)
            cc += 1
        rc += 1
    return img_chunks


def _reassemble_chunks(chunks: np.ndarray) -> np.ndarray:
    """
    Rebuilds an image from a (row_chunks, col_chunks, 32, 32, 1) grid.
    Returns a float32 2-D array (H×W).
    """
    oph = chunks.shape[0] * 32
    opw = chunks.shape[1] * 32
    page = np.ones((oph, opw), dtype="float32")
    for r, row in enumerate(chunks):
        for c, chunk in enumerate(row):
            page[r * 32:(r + 1) * 32, c * 32:(c + 1) * 32] = chunk.reshape(32, 32)
    return page


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_denoiser(model_path: str):
    """
    Loads the trained autoencoder from a .keras / .h5 file.
    Returns the Keras model, or None if the file doesn't exist yet.

    Usage (in app startup):
        app.state.denoiser = load_denoiser("models/denoiser.keras")
    """
    if not os.path.exists(model_path):
        logger.warning(
            "Denoiser model not found at '%s'. "
            "Run the training notebook and save the model first. "
            "Denoising endpoint will return 503 until the model is loaded.",
            model_path,
        )
        return None

    try:
        from keras.models import load_model
        model = load_model(model_path)
        logger.info("Denoiser model loaded from '%s'.", model_path)
        return model
    except Exception as exc:
        logger.error("Failed to load denoiser model: %s", exc)
        return None


def denoise_image(image_path: str, model) -> np.ndarray:
    """
    Runs the autoencoder on a full document image.

    Parameters
    ----------
    image_path : str
        Path to the input (noisy) image.
    model : Keras Model
        The loaded autoencoder (from load_denoiser).

    Returns
    -------
    np.ndarray
        Denoised image as a uint8 2-D array (grayscale, 0-255).
        The output is cropped to the largest 32-divisible size
        (same limitation as the notebook).

    Raises
    ------
    FileNotFoundError  — if image_path doesn't exist.
    ValueError         — if the image cannot be read by OpenCV.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    page = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if page is None:
        raise ValueError(f"cv2 could not read image: {image_path}")

    # Normalise to [0, 1]
    page_f = page.astype("float32") / 255.0

    # Slice into 32×32 patches
    chunks = _get_chunks(page_f)
    row_chunks, col_chunks = chunks.shape[:2]

    # Flatten the 2-D grid into a batch for a single model.predict call
    batch = chunks.reshape(-1, 32, 32, 1)          # (N, 32, 32, 1)
    predicted = model.predict(batch, verbose=0)     # (N, 32, 32, 1)

    # Reshape back to 2-D grid and reassemble
    predicted_grid = predicted.reshape(row_chunks, col_chunks, 32, 32, 1)
    denoised_f = _reassemble_chunks(predicted_grid)

    # Convert back to uint8
    denoised_uint8 = (denoised_f * 255).clip(0, 255).astype("uint8")
    return denoised_uint8


def denoise_image_to_file(image_path: str, model, output_dir: str) -> str:
    """
    Convenience wrapper: runs denoise_image and writes the result to output_dir.

    Returns the output file path.
    """
    os.makedirs(output_dir, exist_ok=True)
    denoised = denoise_image(image_path, model)
    out_name = f"denoised_{uuid.uuid4().hex[:8]}.png"
    out_path = os.path.join(output_dir, out_name)
    cv2.imwrite(out_path, denoised)
    return out_path
