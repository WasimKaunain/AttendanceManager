import numpy as np
import os

THRESHOLD = float(os.getenv("THRESHOLD", 0.75))
def cosine_similarity(a: list[float], b: list[float]) -> float:
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def is_same_person(emb1, emb2) -> bool:
    if len(emb1) != len(emb2) or len(emb1) == 0:
        return False

    similarity = cosine_similarity(emb1, emb2)
    print("Similarity:", similarity)

    return similarity >= THRESHOLD