package com.attendcrew.app.data.model

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val username: String,
    val password: String,
    @SerializedName("login_as")
    val loginAs: String? = null
)
