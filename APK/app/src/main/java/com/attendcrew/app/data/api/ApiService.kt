package com.attendcrew.app.data.api

import com.attendcrew.app.data.model.AdminSelectSiteRequest
import com.attendcrew.app.data.model.AdminSelectSiteResponse
import com.attendcrew.app.data.model.AdminSite
import com.attendcrew.app.data.model.AttendanceRecord
import com.attendcrew.app.data.model.DashboardStats
import com.attendcrew.app.data.model.GeofenceResponse
import com.attendcrew.app.data.model.LocationRequest
import com.attendcrew.app.data.model.LoginRequest
import com.attendcrew.app.data.model.LoginResponse
import com.attendcrew.app.data.model.RecentActivity
import com.attendcrew.app.data.model.SiteWorker
import com.attendcrew.app.data.model.WeeklyDay
import com.attendcrew.app.data.model.WorkerResponse
import com.attendcrew.app.data.model.WorkerPhotoResponse

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

    // ── Admin site scope ─────────────────────────────────────────────────────

    @GET("mobile/admin/sites")
    suspend fun getAdminSites(): Response<List<AdminSite>>

    @POST("mobile/admin/select-site")
    suspend fun selectAdminSite(
        @Body request: AdminSelectSiteRequest
    ): Response<AdminSelectSiteResponse>

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
        @Query("search") search: String? = null
    ): Response<List<WorkerResponse>>

    /** Full worker list for the Workers tab */
    @GET("mobile/site-workers")
    suspend fun getSiteWorkers(
        @Query("search") search: String? = null,
        @Query("status") status: String? = null
    ): Response<List<SiteWorker>>

    /** Signed profile image URL from mobile API (Cloudflare R2) */
    @GET("mobile/workers/{worker_id}/photo")
    suspend fun getWorkerPhoto(
        @Path("worker_id") workerId: String
    ): Response<WorkerPhotoResponse>

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
