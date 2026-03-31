package com.attendcrew.app.data.model

import com.google.gson.annotations.SerializedName

data class AdminSelectSiteResponse(
    val access_token: String,
    val role: String,
    @SerializedName("selected_site_id")
    val selectedSiteId: String,
    @SerializedName("selected_site_name")
    val selectedSiteName: String
)


