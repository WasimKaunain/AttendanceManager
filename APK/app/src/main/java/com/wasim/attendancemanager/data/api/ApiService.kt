package com.wasim.attendancemanager.data.api

import com.wasim.attendancemanager.data.model.AttendanceRecord
import com.wasim.attendancemanager.data.model.DashboardStats
import com.wasim.attendancemanager.data.model.GeofenceResponse
import com.wasim.attendancemanager.data.model.LocationRequest
import com.wasim.attendancemanager.data.model.LoginRequest
import com.wasim.attendancemanager.data.model.LoginResponse
import com.wasim.attendancemanager.data.model.RecentActivity
import com.wasim.attendancemanager.data.model.SiteWorker
import com.wasim.attendancemanager.data.model.WeeklyDay
import com.wasim.attendancemanager.data.model.WorkerResponse

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

    // ── Dashboard ────────────────────────────────────────────────────────────

    @GET("mobile/dashboard/stats")
    suspend fun getDashboardStats(): Response<DashboardStats>

    @GET("mobile/dashboard/weekly")
    suspend fun getWeeklyAttendance(): Response<List<WeeklyDay>>

    @GET("mobile/dashboard/recent-activity")
    suspend fun getRecentActivity(): Response<List<RecentActivity>>

    // ── Workers ───────────────────────────────────────────────────────────────

    /** Used by camera flow (enroll / check-in / check-out) — active workers only */
    @GET("mobile/workers")
    suspend fun getWorkers(
        @Query("search") search: String? = null,
        @Query("site_id") siteId: String? = null
    ): Response<List<WorkerResponse>>

    /** Full worker list for the Workers tab */
    @GET("mobile/site-workers")
    suspend fun getSiteWorkers(
        @Query("search") search: String? = null,
        @Query("status") status: String? = null
    ): Response<List<SiteWorker>>

    // ── Attendance ────────────────────────────────────────────────────────────

    @GET("mobile/site-attendance")
    suspend fun getSiteAttendance(
        @Query("worker_name") workerName: String? = null,
        @Query("date_from") dateFrom: String? = null,
        @Query("date_to") dateTo: String? = null,
        @Query("sort_order") sortOrder: String? = null
    ): Response<List<AttendanceRecord>>

    // ── Geofence ──────────────────────────────────────────────────────────────

    @POST("mobile/verify-geofence")
    suspend fun verifyGeofence(
        @Body request: LocationRequest
    ): Response<GeofenceResponse>

    // ── Face / Attendance actions ─────────────────────────────────────────────

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


