package com.wasim.attendancemanager.data.model

import com.google.gson.annotations.SerializedName

data class AdminSelectSiteRequest(
    @SerializedName("site_id")
    val siteId: String,
    val latitude: Double,
    val longitude: Double
)


