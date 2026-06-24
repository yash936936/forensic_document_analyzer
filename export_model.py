"""
export_model.py

"""

import os
import numpy as np
import cv2
from glob import glob
from sklearn.model_selection import train_test_split

from keras.models import Model
from keras.layers import Conv2D, MaxPooling2D, UpSampling2D, Input


# ---------------------------------------------------------------------------
# 1. Paths — adjust DATA_ROOT if needed
# ---------------------------------------------------------------------------

DATA_ROOT = "./dataset"
OUTPUT_DIR = os.path.join("ai-service", "models")
os.makedirs(OUTPUT_DIR, exist_ok=True)

KERAS_OUT = os.path.join(OUTPUT_DIR, "denoiser.keras")
H5_OUT    = os.path.join(OUTPUT_DIR, "denoiser.h5")


# ---------------------------------------------------------------------------
# 2. Model definition (identical to train_model.ipynb)
# ---------------------------------------------------------------------------

def get_model():
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
# 3. Load data
# ---------------------------------------------------------------------------

train_files        = sorted(glob(os.path.join(DATA_ROOT, "train/*")))
train_cleaned_files = sorted(glob(os.path.join(DATA_ROOT, "train_cleaned/*")))

print(f"Found {len(train_files)} training pairs.")

X, Y = [], []
for noisy_path, clean_path in zip(train_files, train_cleaned_files):
    noisy = cv2.imread(noisy_path, cv2.IMREAD_GRAYSCALE)
    clean = cv2.imread(clean_path, cv2.IMREAD_GRAYSCALE)
    if noisy is None or clean is None:
        continue
    X.append(noisy / 255.0)
    Y.append(clean / 255.0)

X = np.array(X).reshape(-1, 32, 32, 1).astype("float32")
Y = np.array(Y).reshape(-1, 32, 32, 1).astype("float32")

x_train, x_val, y_train, y_val = train_test_split(X, Y, test_size=0.2, random_state=42)
print(f"Train: {x_train.shape}  Val: {x_val.shape}")


# ---------------------------------------------------------------------------
# 4. Train
# ---------------------------------------------------------------------------

model = get_model()
model.summary()

model.fit(
    x_train, y_train,
    epochs=50,
    batch_size=32,
    validation_data=(x_val, y_val),
)


# ---------------------------------------------------------------------------
# 5. Export
# ---------------------------------------------------------------------------

model.save(KERAS_OUT)
print(f"✅  Saved Keras model → {KERAS_OUT}")

model.save(H5_OUT)
print(f"✅  Saved H5 model    → {H5_OUT}")
