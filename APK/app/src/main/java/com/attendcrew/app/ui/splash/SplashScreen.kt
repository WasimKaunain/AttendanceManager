package com.attendcrew.app.ui.splash

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import com.attendcrew.app.R

@Composable
fun SplashScreen(
    onFinished: () -> Unit
) {
    val context = androidx.compose.ui.platform.LocalContext.current

    val appLogoScale = remember { Animatable(4.5f) }
    val appLogoAlpha = remember { Animatable(0f) }
    var showTagline by remember { mutableStateOf(false) }
    var showSplashContent by remember { mutableStateOf(true) }

    var poweredByText by remember { mutableStateOf("") }

    LaunchedEffect(Unit)
    {
        // Giant logo zooms to normal size
        appLogoAlpha.animateTo(1f,animationSpec = tween(300))

        appLogoScale.animateTo(1f,animationSpec = tween(durationMillis = 650,easing = FastOutSlowInEasing))

        // Hold
        delay(400)

        // Show tagline
        showTagline = true

        delay(400)

        // Typing effect
        val target = "Powered By AINTSOL"

        for (i in target.indices)
        {
            poweredByText = target.substring(0, i + 1)
            delay(80)
        }

        // Hold final screen
        delay(500)

        showSplashContent = false

        delay(300)

        onFinished()
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF001B6E))) {
        AnimatedVisibility(
            visible = showSplashContent,
            enter = fadeIn(animationSpec = tween(250)),
            exit = fadeOut(animationSpec = tween(420)) + slideOutVertically(animationSpec = tween(420), targetOffsetY = { -it / 2 }),
            modifier = Modifier.align(Alignment.Center)
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally,verticalArrangement = Arrangement.Center) {

                Spacer(modifier = Modifier.height(14.dp))

                    Image(
                        painter= painterResource(R.drawable.logo_splash),
                        contentDescription = "AttendCrew Logo",
                        modifier = Modifier.size(280.dp).graphicsLayer {
                                alpha = appLogoAlpha.value
                                scaleX = appLogoScale.value
                                scaleY = appLogoScale.value
                            }
                    )

                Spacer(modifier = Modifier.height(24.dp))

                AnimatedVisibility(visible = showTagline,enter = fadeIn(animationSpec = tween(500)))
                {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "Workforce Attendance Management",
                            color = Color.White.copy(alpha = 0.92f),
                            style = MaterialTheme.typography.titleMedium
                        )

                        Spacer(Modifier.height(16.dp))

                        Text(
                            text = poweredByText,
                            color = Color(0xFFFFA726),
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }
    }
}
