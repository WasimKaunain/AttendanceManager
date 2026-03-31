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
     * Default is PKR since the app is built for Pakistan.
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
        private val RATES_FROM_PKR: Map<String, Double> = mapOf(
            "PKR" to 1.0,
            "USD" to 0.003571,
            "GBP" to 0.002817,
            "EUR" to 0.003279,
            "INR" to 0.29762,
            "SAR" to 0.013393,
            "AED" to 0.013095,
            "QAR" to 0.012987
        )

        /**
         * Convert [amountInPkr] (stored in PKR) to [toCurrency].
         */
        fun convertFromPkr(amountInPkr: Double, toCurrency: String): Double {
            val rate = RATES_FROM_PKR[toCurrency] ?: 1.0
            return amountInPkr * rate
        }

        /**
         * Format [amountInPkr] as a human-readable string in [toCurrency].
         * e.g.  "$ 357"  or  "₹ 8,929"
         */
        fun formatMoney(amountInPkr: Double, toCurrency: String): String {
            val converted = convertFromPkr(amountInPkr, toCurrency)
            val symbol    = symbolFor(toCurrency)
            return when {
                converted >= 1_000_000 -> "$symbol ${"%.2f".format(converted / 1_000_000)}M"
                converted >= 1         -> "$symbol ${"%.0f".format(converted)}"
                converted > 0          -> "$symbol ${"%.4f".format(converted)}"
                else                   -> "$symbol 0"
            }
        }
    }
}

data class CurrencyOption(
    val code: String,
    val name: String,
    val symbol: String
)

