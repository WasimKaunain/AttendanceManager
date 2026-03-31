package com.attendcrew.app.data.model

import com.google.gson.annotations.SerializedName

data class LoginResponse(
    val access_token: String,
    val role: String? = null,
    val site_id: String? = null,
    val site_name: String? = null,
    @SerializedName("selected_site_id")
    val selectedSiteId: String? = null,
    @SerializedName("selected_site_name")
    val selectedSiteName: String? = null
)
