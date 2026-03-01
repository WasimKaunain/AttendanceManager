import numpy as np
import os

def cosine_similarity(a: list[float], b: list[float]) -> float:
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def is_same_person(emb1: list[float],emb2: list[float],threshold: float = os.getenv('THRESHOLD')) -> bool:

    if len(emb1) != len(emb2):
        return False

    if len(emb1) == 0:
        return False

    return cosine_similarity(emb1, emb2) >= threshold