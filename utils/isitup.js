import memo from '@/utils/memo'

const isitup = memo(async (url) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            const isitup_res = await fetch(url)
            if (isitup_res.status >= 400) {
                throw new Error(isitup_res.statusText)
            }
        }
        return 'yes'
    } catch (e) {
        return e.toString()
    }
})
export default isitup