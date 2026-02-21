import numpy as np
from deepface import DeepFace


def extract_face_embedding(image_path: str) -> list[float]:
    """
    Takes an image file path
    Returns face embedding as list[float]
    """
    embedding = DeepFace.represent(img_path=image_path,model_name="Facenet",enforce_detection=True)[0]["embedding"]

    return embedding


def cosine_similarity(a: list[float], b: list[float]) -> float:
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def is_same_person(emb1: list[float],emb2: list[float],threshold: float = 0.75) -> bool:
    return cosine_similarity(emb1, emb2) >= threshold
