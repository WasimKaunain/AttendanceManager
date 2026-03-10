package com.wasim.attendancemanager.data.api

import com.wasim.attendancemanager.data.model.LoginRequest
import com.wasim.attendancemanager.data.model.LoginResponse
import com.wasim.attendancemanager.data.model.WorkerResponse
import com.wasim.attendancemanager.data.model.LocationRequest
import com.wasim.attendancemanager.data.model.GeofenceResponse

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

import retrofit2.http.Multipart
import retrofit2.http.Part
import retrofit2.http.Path
import okhttp3.MultipartBody
import okhttp3.RequestBody

interface ApiService {

    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    @GET("mobile/workers")
    suspend fun getWorkers(
        @Query("search") search: String? = null,
        @Query("site_id") siteId: String? = null
    ): Response<List<WorkerResponse>>

    @POST("mobile/verify-geofence")
    suspend fun verifyGeofence(
        @Body request: LocationRequest
    ): Response<GeofenceResponse>

    @Multipart
    @POST("mobile/enroll-face/{worker_id}")
    suspend fun enrollFace(
        @Path("worker_id") workerId: String,
        @Part("embedding") embedding: RequestBody,
        @Part photo: MultipartBody.Part
    ): Response<Any>


    @Multipart
    @POST("mobile/check-in")
    suspend fun checkIn(
        @Part("worker_id") workerId: RequestBody,
        @Part("latitude") latitude: RequestBody,
        @Part("longitude") longitude: RequestBody,
        @Part("embedding") embedding: RequestBody,
        @Part photo: MultipartBody.Part
    ): Response<Any>


    @Multipart
    @POST("mobile/check-out")
    suspend fun checkOut(
        @Part("worker_id") workerId: RequestBody,
        @Part("latitude") latitude: RequestBody,
        @Part("longitude") longitude: RequestBody,
        @Part("embedding") embedding: RequestBody,
        @Part photo: MultipartBody.Part
    ): Response<Any>
}
