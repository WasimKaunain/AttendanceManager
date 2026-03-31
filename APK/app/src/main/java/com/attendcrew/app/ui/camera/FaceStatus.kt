package com.attendcrew.app.ui.camera

enum class FaceStatus {
    NO_FACE,           // no face detected
    DETECTED,          // face found, checks running
    TOO_CLOSE,         // face too close to camera
    TOO_FAR,           // face too small / too far
    NOT_CENTERED,      // face outside oval or head tilted
    EYES_CLOSED,       // eyes not open
    LOW_BRIGHTNESS,    // lighting too dark
    BLINK_REQUIRED,    // please blink once (liveness check)
    HOLD_STEADY,       // all checks pass — holding steady, counting frames
    READY              // capture triggered
}