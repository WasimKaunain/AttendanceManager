package com.attendcrew.app.data.api

import okhttp3.Interceptor
import okhttp3.Response
import android.content.Context
import com.attendcrew.app.data.local.TokenManager

class AuthInterceptor(private val context: Context) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {

        val tokenManager = TokenManager(context)
        val token = tokenManager.getToken()

        val requestBuilder = chain.request().newBuilder()

        token?.let {
            requestBuilder.addHeader("Authorization", "Bearer $it")
        }

        val response = chain.proceed(requestBuilder.build())

        // If the server says the token is invalid/expired, wipe it locally
        // so that isLoggedIn() returns false and the user is sent back to login
        if (response.code == 401) {
            tokenManager.clearAll()
        }

        return response
    }
}
