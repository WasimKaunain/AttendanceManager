package com.attendcrew.app.utils

import com.google.gson.Gson
import kotlin.math.*

object GeoFenceLocalChecker {

    data class Point(val lat: Double, val lng: Double)

    fun isInside(
        workerLat: Double,
        workerLng: Double,
        boundaryType: String,
        siteLat: Double,
        siteLng: Double,
        radiusM: Double?,
        polygonJson: String?
    ): Pair<Boolean, Double?> {
        return if (boundaryType.lowercase() == "polygon") {
            val pts = parsePolygon(polygonJson)
            val inside = pointInPolygon(Point(workerLat, workerLng), pts)
            Pair(inside, null)
        } else {
            val rad = radiusM ?: 0.0
            val dist = haversineMeters(workerLat, workerLng, siteLat, siteLng)
            Pair(dist <= rad, dist)
        }
    }

    private fun parsePolygon(json: String?): List<Point> {
        if (json.isNullOrBlank()) return emptyList()
        return try {
            val gson = Gson()
            val type = com.google.gson.reflect.TypeToken.getParameterized(
                List::class.java,
                com.google.gson.reflect.TypeToken.getParameterized(
                    Map::class.java,
                    String::class.java,
                    Double::class.java
                ).type
            ).type
            val arr: List<Map<String, Double>> = gson.fromJson(json, type)
            arr.mapNotNull {
                val lat = it["lat"]
                val lng = it["lng"]
                if (lat != null && lng != null) Point(lat, lng) else null
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    // Ray casting algorithm
    private fun pointInPolygon(p: Point, polygon: List<Point>): Boolean {
        if (polygon.size < 3) return false
        var inside = false
        var j = polygon.size - 1
        for (i in polygon.indices) {
            val pi = polygon[i]
            val pj = polygon[j]
            val intersect = ((pi.lng > p.lng) != (pj.lng > p.lng)) &&
                (p.lat < (pj.lat - pi.lat) * (p.lng - pi.lng) / ((pj.lng - pi.lng) + 1e-12) + pi.lat)
            if (intersect) inside = !inside
            j = i
        }
        return inside
    }

    private fun haversineMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371000.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2.0) + cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(dLon / 2).pow(2.0)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return r * c
    }
}
