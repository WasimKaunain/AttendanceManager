package com.attendcrew.app.utils.ml

import kotlin.math.sqrt

object FaceMatcher {

    data class MatchResult(
        val bestWorkerId: Int?,
        val bestSimilarity: Float,
        val threshold: Float,
        val passed: Boolean
    )

    /**
     * Cosine similarity for L2-normalized embeddings.
     * If embeddings are normalized (they are in [FaceEmbeddingManager]), cosine is dot product.
     */
    fun cosineSimilarity(a: FloatArray, b: FloatArray): Float {
        val n = minOf(a.size, b.size)
        var dot = 0f
        var na = 0f
        var nb = 0f
        for (i in 0 until n) {
            dot += a[i] * b[i]
            na += a[i] * a[i]
            nb += b[i] * b[i]
        }
        if (na <= 0f || nb <= 0f) return 0f
        return dot / (sqrt(na) * sqrt(nb))
    }

    fun bestMatch(
        probe: FloatArray,
        candidates: List<Pair<Int, FloatArray>>,
        threshold: Float
    ): MatchResult {
        var bestId: Int? = null
        var best = -1f
        for ((id, emb) in candidates) {
            val sim = cosineSimilarity(probe, emb)
            if (sim > best) {
                best = sim
                bestId = id
            }
        }
        return MatchResult(
            bestWorkerId = bestId,
            bestSimilarity = best,
            threshold = threshold,
            passed = best >= threshold
        )
    }
}
