package com.wasim.attendancemanager.data.api

import okhttp3.Interceptor
import okhttp3.Response
import android.content.Context
import com.wasim.attendancemanager.data.local.TokenManager

class AuthInterceptor(private val context: Context) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {

        val tokenManager = TokenManager(context)
        val token = tokenManager.getToken()

        val requestBuilder = chain.request().newBuilder()

        token?.let {
            requestBuilder.addHeader("Authorization", "Bearer $it")
        }

        return chain.proceed(requestBuilder.build())
    }
}
