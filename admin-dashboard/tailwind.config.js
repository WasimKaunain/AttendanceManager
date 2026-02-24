/** @type {import('tailwindcss').Config} */
export default 
{
  darkMode: "class",
  content : ["./index.html" , "./src/**/*.{js,ts,jsx,tsx}" ,],
  theme   : {
              extend  : {
                        colors: {
                                  brand:  {
                                            primary: "#0F172A",     // deep slate
                                            accent: "#10B981",      // emerald
                                            muted: "#F8FAFC",       // light bg
                                          }
                                },  
                        },
            },
  plugins: [],
}
