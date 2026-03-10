package com.wasim.attendancemanager.utils

import android.annotation.SuppressLint
import android.content.Context
import com.google.android.gms.location.LocationServices
import android.location.Location

class LocationHelper(private val context: Context) {

    private val fusedLocationClient =
        LocationServices.getFusedLocationProviderClient(context)

    @SuppressLint("MissingPermission")
    fun getCurrentLocation(onResult: (Double, Double) -> Unit) {

        fusedLocationClient.lastLocation
            .addOnSuccessListener { location: android.location.Location? ->

                if (location != null) {
                    onResult(location.latitude, location.longitude)
                }
            }
    }
}
