const colors = require('tailwindcss/colors')

module.exports = {
    content: ['./**/*.{html,js}'],
    theme: {
        extend: {
            colors: {
                primary: colors.indigo[600],
                secondary: colors.indigo[800],
                'light-text': colors.slate[600],
            },
        },
    },
    plugins: [],
} 