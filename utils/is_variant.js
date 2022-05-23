export default function is_variant (search) {
  return /^(rs\d+|chr\d+:)/.exec(search) !== null && search !== 'rs1'
}
