package com.attendcrew.app.data.local

import android.content.Context

/**
 * Stores user preferences (theme, currency) in SharedPreferences.
 * Separate from auth prefs so clearing auth doesn't wipe settings.
 */
class AppPreferences(context: Context) {

    private val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)

    // ── Theme ─────────────────────────────────────────────────────────────────

    /** true = dark mode, false = light mode */
    var isDarkTheme: Boolean
        get()      = prefs.getBoolean("dark_theme", false)
        set(value) = prefs.edit().putBoolean("dark_theme", value).apply()

    // ── Currency ──────────────────────────────────────────────────────────────

    /**
     * ISO currency code, e.g. "PKR", "USD", "INR", "SAR", "AED"
     * Default is SAR since the app is built for Saudi Arabia.
     */
    var currency: String
        get()      = prefs.getString("currency", "PKR") ?: "PKR"
        set(value) = prefs.edit().putString("currency", value).apply()

    companion object {
        /** Supported currencies with display names */
        val CURRENCIES = listOf(
            CurrencyOption("PKR", "Pakistani Rupee",   "₨"),
            CurrencyOption("USD", "US Dollar",         "$"),
            CurrencyOption("GBP", "British Pound",     "£"),
            CurrencyOption("EUR", "Euro",              "€"),
            CurrencyOption("INR", "Indian Rupee",      "₹"),
            CurrencyOption("SAR", "Saudi Riyal",       "SR"),
            CurrencyOption("AED", "UAE Dirham",        "د.إ"),
            CurrencyOption("QAR", "Qatari Riyal",      "QR"),
        )

        fun symbolFor(code: String): String =
            CURRENCIES.find { it.code == code }?.symbol ?: code

        /**
         * Approximate exchange rates relative to PKR (1 PKR = X foreign currency).
         * Base currency is PKR. Rates are approximate and static — suitable for
         * display purposes.
         *
         * 1 PKR ≈ these values (as of early 2026):
         *   USD: ~0.00357  (1 USD ≈ 280 PKR)
         *   GBP: ~0.00282  (1 GBP ≈ 355 PKR)
         *   EUR: ~0.00328  (1 EUR ≈ 305 PKR)
         *   INR: ~0.29762  (1 INR ≈ 3.35 PKR)
         *   SAR: ~0.01339  (1 SAR ≈ 74.7 PKR)
         *   AED: ~0.01309  (1 AED ≈ 76.4 PKR)
         *   QAR: ~0.01299  (1 QAR ≈ 77 PKR)
         */

        // Base = SAR
        private val RATES_FROM_SAR = mapOf(
            "SAR" to 1.0,
            "INR" to 24.65,   // from live data
            "USD" to 0.27,
            "PKR" to 74.0,
            "AED" to 0.98,
            "QAR" to 0.97
        )

        /**
         * Convert [amountInSAR] (stored in SAR) to [toCurrency].
         */
        fun convertFromSar(amountInSar: Double, toCurrency: String): Double {
            val rate = RATES_FROM_SAR[toCurrency] ?: 1.0
            return amountInSar * rate
        }

        /**
         * Format [amountInSAR] as a human-readable string in [toCurrency].
         * e.g.  "$ 357"  or  "₹ 8,929"
         */
        fun formatMoney(amountInSar: Double, toCurrency: String): String {
            val converted = convertFromSar(amountInSar, toCurrency)
            val symbol = symbolFor(toCurrency)

            return "$symbol %.2f".format(converted)
        }
    }
}

data class CurrencyOption(
    val code: String,
    val name: String,
    val symbol: String
)

