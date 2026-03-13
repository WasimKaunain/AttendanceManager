package com.wasim.attendancemanager.ui.splash

import android.graphics.BitmapFactory
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import java.util.Calendar
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    onFinished: () -> Unit
) {
    val context = androidx.compose.ui.platform.LocalContext.current

    val appLogoScale = remember { Animatable(0.82f) }
    val appLogoAlpha = remember { Animatable(0f) }

    var appLogo by remember { mutableStateOf<android.graphics.Bitmap?>(null) }
    var companyLogo by remember { mutableStateOf<android.graphics.Bitmap?>(null) }
    var showPoweredText by remember { mutableStateOf(false) }
    var showCompanyLogo by remember { mutableStateOf(false) }
    var showRights by remember { mutableStateOf(false) }
    var showSplashContent by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        appLogo = runCatching { context.assets.open("APK_LOGO.jpg").use(BitmapFactory::decodeStream) }.getOrNull()
        companyLogo = runCatching { context.assets.open("AINTSOL_LOGO.png").use(BitmapFactory::decodeStream) }.getOrNull()

        appLogoAlpha.animateTo(1f, animationSpec = tween(durationMillis = 380, easing = FastOutSlowInEasing))
        appLogoScale.animateTo(1f, animationSpec = tween(durationMillis = 650, easing = FastOutSlowInEasing))

        delay(250)
        showPoweredText = true
        delay(300)
        showCompanyLogo = true
        delay(280)
        showRights = true

        // Hold briefly after everything is visible, then exit all at once.
        delay(1300)
        showSplashContent = false
        delay(420)
        onFinished()
    }

    val currentYear = remember { Calendar.getInstance().get(Calendar.YEAR) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp, vertical = 20.dp)
    ) {
        AnimatedVisibility(
            visible = showSplashContent,
            enter = fadeIn(animationSpec = tween(250)),
            exit = fadeOut(animationSpec = tween(420)) +
                slideOutVertically(animationSpec = tween(420), targetOffsetY = { -it / 2 }),
            modifier = Modifier.align(Alignment.Center)
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "AttendCrew",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.graphicsLayer {
                        alpha = appLogoAlpha.value
                        scaleX = appLogoScale.value
                        scaleY = appLogoScale.value
                    }
                )

                Spacer(modifier = Modifier.height(14.dp))

                if (appLogo != null) {
                    Image(
                        bitmap = appLogo!!.asImageBitmap(),
                        contentDescription = "AttendCrew Logo",
                        modifier = Modifier
                            .size(118.dp)
                            .graphicsLayer {
                                alpha = appLogoAlpha.value
                                scaleX = appLogoScale.value
                                scaleY = appLogoScale.value
                            }
                    )
                } else {
                    Icon(
                        imageVector = Icons.Filled.Business,
                        contentDescription = "AttendCrew Logo",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier
                            .size(88.dp)
                            .graphicsLayer {
                                alpha = appLogoAlpha.value
                                scaleX = appLogoScale.value
                                scaleY = appLogoScale.value
                            }
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                AnimatedVisibility(
                    visible = showPoweredText,
                    enter = fadeIn(animationSpec = tween(420)) +
                        slideInVertically(animationSpec = tween(420), initialOffsetY = { it / 2 }) +
                        scaleIn(animationSpec = tween(420), initialScale = 0.72f)
                ) {
                    Text(
                        text = "Powered by Aintsol",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                AnimatedVisibility(
                    visible = showCompanyLogo,
                    enter = fadeIn(animationSpec = tween(380)) + scaleIn(animationSpec = tween(380), initialScale = 0.85f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .background(
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                                shape = CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        if (companyLogo != null) {
                            Image(
                                bitmap = companyLogo!!.asImageBitmap(),
                                contentDescription = "AINTSOL Logo",
                                modifier = Modifier.size(24.dp)
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Filled.Business,
                                contentDescription = "AINTSOL Logo",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                }
            }
        }

        AnimatedVisibility(
            visible = showRights && showSplashContent,
            enter = fadeIn(animationSpec = tween(380)) + slideInVertically(animationSpec = tween(380), initialOffsetY = { it / 2 }),
            exit = fadeOut(animationSpec = tween(420)) +
                slideOutVertically(animationSpec = tween(420), targetOffsetY = { -it / 2 }),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 10.dp)
        ) {
            Text(
                text = "© $currentYear @AINTSOL. All rights reserved.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
