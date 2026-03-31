package com.attendcrew.app.utils

import android.annotation.SuppressLint
import android.content.Context
import android.widget.Toast
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource

class LocationHelper(private val context: Context) {

    private val fusedLocationClient =
        LocationServices.getFusedLocationProviderClient(context)

    @SuppressLint("MissingPermission")
    fun getCurrentLocation(
        onResult: (Double, Double) -> Unit,
        onFailure: (() -> Unit)? = null
    ) {
        // First try lastLocation for speed
        fusedLocationClient.lastLocation
            .addOnSuccessListener { location ->
                if (location != null) {
                    onResult(location.latitude, location.longitude)
                } else {
                    // Fallback: request a fresh location
                    val cancellationSource = CancellationTokenSource()
                    fusedLocationClient
                        .getCurrentLocation(
                            Priority.PRIORITY_HIGH_ACCURACY,
                            cancellationSource.token
                        )
                        .addOnSuccessListener { freshLocation ->
                            if (freshLocation != null) {
                                onResult(freshLocation.latitude, freshLocation.longitude)
                            } else {
                                Toast.makeText(
                                    context,
                                    "Unable to get location. Please ensure GPS is enabled.",
                                    Toast.LENGTH_LONG
                                ).show()
                                onFailure?.invoke()
                            }
                        }
                        .addOnFailureListener {
                            Toast.makeText(
                                context,
                                "Location error: ${it.message}",
                                Toast.LENGTH_LONG
                            ).show()
                            onFailure?.invoke()
                        }
                }
            }
            .addOnFailureListener {
                Toast.makeText(
                    context,
                    "Location error: ${it.message}",
                    Toast.LENGTH_LONG
                ).show()
                onFailure?.invoke()
            }
    }
}
