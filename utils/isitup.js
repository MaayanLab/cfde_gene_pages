import memo from '@/utils/memo'
import fetchEx from '@/utils/fetchEx'

const isitup = memo(async (url) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            const isitup_res = await fetchEx(url)
            if (isitup_res.status >= 400) {
                throw new Error(`isitup returned ${isitup_res.statusText}`)
            }
        }
        return true
    } catch (e) {
        console.warn(e.toString())
        return false
    }
})
export default isitup