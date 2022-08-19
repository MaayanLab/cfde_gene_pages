export default function argmax(obj) {
  let max
  for (const arg in obj) {
    if (max === undefined || obj[arg] > obj[max]) {
      max = arg
    }
  }
  return max
}