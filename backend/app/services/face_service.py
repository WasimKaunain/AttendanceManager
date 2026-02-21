import numpy as np

def cosine_similarity(a: list[float], b: list[float]) -> float:
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def is_same_person(emb1: list[float],emb2: list[float],threshold: float = 0.75) -> bool:
    return cosine_similarity(emb1, emb2) >= threshold
