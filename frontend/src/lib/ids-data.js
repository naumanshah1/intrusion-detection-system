// NSL-KDD Dataset feature types and mock data for IDS Sentinel

export const SEVERITY_COLORS = {
  critical: "text-rose-400 bg-rose-400/10 border-rose-400/30",
  high: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  low: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  info: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
};

export const CATEGORY_COLORS = {
  normal: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  DoS: "text-rose-400 bg-rose-400/10 border-rose-400/30",
  Probe: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  R2L: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  U2R: "text-purple-400 bg-purple-400/10 border-purple-400/30",
};

export const MOCK_ALERTS = [
  {
    id: "ALT-001", timestamp: "2026-03-29T09:14:22Z", src_ip: "203.0.113.47", dst_ip: "10.0.0.1",
    src_port: 54821, dst_port: 80, prediction: "neptune", category: "DoS", severity: "critical",
    confidence: 0.97, model: "RandomForest v2.3", status: "new",
    features: { duration: 0, protocol_type: "tcp", service: "http", flag: "S0", src_bytes: 0, dst_bytes: 0, land: 0, wrong_fragment: 0, urgent: 0, hot: 0, num_failed_logins: 0, logged_in: 0, num_compromised: 0, root_shell: 0, su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 511, srv_count: 511, serror_rate: 1.0, srv_serror_rate: 1.0, rerror_rate: 0.0, srv_rerror_rate: 0.0, same_srv_rate: 1.0, diff_srv_rate: 0.0, srv_diff_host_rate: 0.0, dst_host_count: 255, dst_host_srv_count: 255, dst_host_same_srv_rate: 1.0, dst_host_diff_srv_rate: 0.0, dst_host_same_src_port_rate: 0.01, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 1.0, dst_host_srv_serror_rate: 1.0, dst_host_rerror_rate: 0.0, dst_host_srv_rerror_rate: 0.0 },
  },
  {
    id: "ALT-002", timestamp: "2026-03-29T09:12:05Z", src_ip: "198.51.100.22", dst_ip: "10.0.0.5",
    src_port: 1030, dst_port: 21, prediction: "ftp_write", category: "R2L", severity: "high",
    confidence: 0.89, model: "XGBoost v1.8", status: "investigating",
    features: { duration: 1, protocol_type: "tcp", service: "ftp", flag: "SF", src_bytes: 529, dst_bytes: 146, land: 0, wrong_fragment: 0, urgent: 0, hot: 1, num_failed_logins: 0, logged_in: 1, num_compromised: 0, root_shell: 0, su_attempted: 0, num_root: 0, num_file_creations: 1, num_shells: 0, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 1, srv_count: 1, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 0.0, srv_rerror_rate: 0.0, same_srv_rate: 1.0, diff_srv_rate: 0.0, srv_diff_host_rate: 0.0, dst_host_count: 9, dst_host_srv_count: 9, dst_host_same_srv_rate: 1.0, dst_host_diff_srv_rate: 0.0, dst_host_same_src_port_rate: 0.11, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0, dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 0.0, dst_host_srv_rerror_rate: 0.0 },
  },
  {
    id: "ALT-003", timestamp: "2026-03-29T09:08:33Z", src_ip: "192.0.2.88", dst_ip: "10.0.0.3",
    src_port: 61234, dst_port: 22, prediction: "ipsweep", category: "Probe", severity: "high",
    confidence: 0.93, model: "RandomForest v2.3", status: "new",
    features: { duration: 0, protocol_type: "icmp", service: "ecr_i", flag: "SF", src_bytes: 8, dst_bytes: 0, land: 0, wrong_fragment: 0, urgent: 0, hot: 0, num_failed_logins: 0, logged_in: 0, num_compromised: 0, root_shell: 0, su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 19, srv_count: 19, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 0.0, srv_rerror_rate: 0.0, same_srv_rate: 1.0, diff_srv_rate: 0.0, srv_diff_host_rate: 0.0, dst_host_count: 255, dst_host_srv_count: 9, dst_host_same_srv_rate: 0.04, dst_host_diff_srv_rate: 0.06, dst_host_same_src_port_rate: 0.0, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0, dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 0.0, dst_host_srv_rerror_rate: 0.0 },
  },
  {
    id: "ALT-004", timestamp: "2026-03-29T09:05:11Z", src_ip: "203.0.113.9", dst_ip: "10.0.0.2",
    src_port: 32100, dst_port: 23, prediction: "buffer_overflow", category: "U2R", severity: "critical",
    confidence: 0.91, model: "XGBoost v1.8", status: "new",
    features: { duration: 0, protocol_type: "tcp", service: "telnet", flag: "SF", src_bytes: 146, dst_bytes: 8223, land: 0, wrong_fragment: 0, urgent: 0, hot: 2, num_failed_logins: 0, logged_in: 1, num_compromised: 0, root_shell: 1, su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 1, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 1, srv_count: 1, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 0.0, srv_rerror_rate: 0.0, same_srv_rate: 1.0, diff_srv_rate: 0.0, srv_diff_host_rate: 0.0, dst_host_count: 3, dst_host_srv_count: 3, dst_host_same_srv_rate: 1.0, dst_host_diff_srv_rate: 0.0, dst_host_same_src_port_rate: 0.33, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0, dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 0.0, dst_host_srv_rerror_rate: 0.0 },
  },
  {
    id: "ALT-005", timestamp: "2026-03-29T08:58:47Z", src_ip: "172.16.0.99", dst_ip: "10.0.0.8",
    src_port: 1025, dst_port: 25, prediction: "smurf", category: "DoS", severity: "critical",
    confidence: 0.99, model: "RandomForest v2.3", status: "resolved",
    features: { duration: 0, protocol_type: "icmp", service: "ecr_i", flag: "SF", src_bytes: 1032, dst_bytes: 0, land: 0, wrong_fragment: 0, urgent: 0, hot: 0, num_failed_logins: 0, logged_in: 0, num_compromised: 0, root_shell: 0, su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 511, srv_count: 511, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 0.0, srv_rerror_rate: 0.0, same_srv_rate: 1.0, diff_srv_rate: 0.0, srv_diff_host_rate: 0.0, dst_host_count: 255, dst_host_srv_count: 255, dst_host_same_srv_rate: 1.0, dst_host_diff_srv_rate: 0.0, dst_host_same_src_port_rate: 1.0, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0, dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 0.0, dst_host_srv_rerror_rate: 0.0 },
  },
  {
    id: "ALT-006", timestamp: "2026-03-29T08:52:18Z", src_ip: "198.51.100.7", dst_ip: "10.0.0.4",
    src_port: 45321, dst_port: 80, prediction: "guess_passwd", category: "R2L", severity: "high",
    confidence: 0.84, model: "XGBoost v1.8", status: "investigating",
    features: { duration: 0, protocol_type: "tcp", service: "http", flag: "REJ", src_bytes: 146, dst_bytes: 0, land: 0, wrong_fragment: 0, urgent: 0, hot: 0, num_failed_logins: 5, logged_in: 0, num_compromised: 0, root_shell: 0, su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 8, srv_count: 8, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 1.0, srv_rerror_rate: 1.0, same_srv_rate: 1.0, diff_srv_rate: 0.0, srv_diff_host_rate: 0.0, dst_host_count: 21, dst_host_srv_count: 21, dst_host_same_srv_rate: 1.0, dst_host_diff_srv_rate: 0.0, dst_host_same_src_port_rate: 0.05, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0, dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 1.0, dst_host_srv_rerror_rate: 1.0 },
  },
  {
    id: "ALT-007", timestamp: "2026-03-29T08:45:00Z", src_ip: "203.0.113.55", dst_ip: "10.0.0.1",
    src_port: 32800, dst_port: 443, prediction: "portsweep", category: "Probe", severity: "medium",
    confidence: 0.87, model: "RandomForest v2.3", status: "new",
    features: { duration: 0, protocol_type: "tcp", service: "private", flag: "REJ", src_bytes: 0, dst_bytes: 0, land: 0, wrong_fragment: 0, urgent: 0, hot: 0, num_failed_logins: 0, logged_in: 0, num_compromised: 0, root_shell: 0, su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 36, srv_count: 1, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 1.0, srv_rerror_rate: 1.0, same_srv_rate: 0.03, diff_srv_rate: 0.97, srv_diff_host_rate: 0.0, dst_host_count: 255, dst_host_srv_count: 18, dst_host_same_srv_rate: 0.07, dst_host_diff_srv_rate: 0.93, dst_host_same_src_port_rate: 0.04, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0, dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 0.98, dst_host_srv_rerror_rate: 0.96 },
  },
  {
    id: "ALT-008", timestamp: "2026-03-29T08:38:12Z", src_ip: "192.0.2.201", dst_ip: "10.0.0.2",
    src_port: 20221, dst_port: 22, prediction: "rootkit", category: "U2R", severity: "critical",
    confidence: 0.88, model: "XGBoost v1.8", status: "new",
    features: { duration: 0, protocol_type: "tcp", service: "ssh", flag: "SF", src_bytes: 334, dst_bytes: 9136, land: 0, wrong_fragment: 0, urgent: 0, hot: 4, num_failed_logins: 0, logged_in: 1, num_compromised: 0, root_shell: 1, su_attempted: 0, num_root: 1, num_file_creations: 0, num_shells: 0, num_access_files: 1, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 1, srv_count: 1, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 0.0, srv_rerror_rate: 0.0, same_srv_rate: 1.0, diff_srv_rate: 0.0, srv_diff_host_rate: 0.0, dst_host_count: 1, dst_host_srv_count: 1, dst_host_same_srv_rate: 1.0, dst_host_diff_srv_rate: 0.0, dst_host_same_src_port_rate: 1.0, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0, dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 0.0, dst_host_srv_rerror_rate: 0.0 },
  },
  {
    id: "ALT-009", timestamp: "2026-03-29T08:30:55Z", src_ip: "198.51.100.44", dst_ip: "10.0.0.6",
    src_port: 1028, dst_port: 80, prediction: "back", category: "DoS", severity: "high",
    confidence: 0.95, model: "RandomForest v2.3", status: "resolved",
    features: { duration: 0, protocol_type: "tcp", service: "http", flag: "SF", src_bytes: 54540, dst_bytes: 8314, land: 0, wrong_fragment: 0, urgent: 0, hot: 0, num_failed_logins: 0, logged_in: 1, num_compromised: 0, root_shell: 0, su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 8, srv_count: 8, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 0.0, srv_rerror_rate: 0.0, same_srv_rate: 1.0, diff_srv_rate: 0.0, srv_diff_host_rate: 0.13, dst_host_count: 255, dst_host_srv_count: 255, dst_host_same_srv_rate: 1.0, dst_host_diff_srv_rate: 0.0, dst_host_same_src_port_rate: 0.0, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0, dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 0.0, dst_host_srv_rerror_rate: 0.0 },
  },
  {
    id: "ALT-010", timestamp: "2026-03-29T08:22:07Z", src_ip: "203.0.113.123", dst_ip: "10.0.0.3",
    src_port: 50012, dst_port: 53, prediction: "nmap", category: "Probe", severity: "medium",
    confidence: 0.79, model: "XGBoost v1.8", status: "false_positive",
    features: { duration: 0, protocol_type: "udp", service: "dns", flag: "SF", src_bytes: 105, dst_bytes: 146, land: 0, wrong_fragment: 0, urgent: 0, hot: 0, num_failed_logins: 0, logged_in: 0, num_compromised: 0, root_shell: 0, su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 222, srv_count: 1, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 0.0, srv_rerror_rate: 0.0, same_srv_rate: 0.0, diff_srv_rate: 1.0, srv_diff_host_rate: 0.0, dst_host_count: 57, dst_host_srv_count: 6, dst_host_same_srv_rate: 0.11, dst_host_diff_srv_rate: 0.07, dst_host_same_src_port_rate: 0.0, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0, dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 0.0, dst_host_srv_rerror_rate: 0.0 },
  },
  {
    id: "ALT-011", timestamp: "2026-03-29T08:15:44Z", src_ip: "172.16.1.44", dst_ip: "10.0.0.7",
    src_port: 33001, dst_port: 21, prediction: "teardrop", category: "DoS", severity: "critical",
    confidence: 0.98, model: "RandomForest v2.3", status: "new",
    features: { duration: 0, protocol_type: "udp", service: "private", flag: "SF", src_bytes: 28, dst_bytes: 0, land: 0, wrong_fragment: 3, urgent: 0, hot: 0, num_failed_logins: 0, logged_in: 0, num_compromised: 0, root_shell: 0, su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 10, srv_count: 10, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 0.0, srv_rerror_rate: 0.0, same_srv_rate: 1.0, diff_srv_rate: 0.0, srv_diff_host_rate: 0.0, dst_host_count: 255, dst_host_srv_count: 255, dst_host_same_srv_rate: 1.0, dst_host_diff_srv_rate: 0.0, dst_host_same_src_port_rate: 0.0, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0, dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 0.0, dst_host_srv_rerror_rate: 0.0 },
  },
  {
    id: "ALT-012", timestamp: "2026-03-29T08:08:31Z", src_ip: "192.0.2.15", dst_ip: "10.0.0.9",
    src_port: 2049, dst_port: 514, prediction: "perl", category: "U2R", severity: "critical",
    confidence: 0.85, model: "XGBoost v1.8", status: "investigating",
    features: { duration: 0, protocol_type: "tcp", service: "private", flag: "SF", src_bytes: 146, dst_bytes: 9204, land: 0, wrong_fragment: 0, urgent: 0, hot: 2, num_failed_logins: 0, logged_in: 1, num_compromised: 0, root_shell: 1, su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 1, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 1, srv_count: 1, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 0.0, srv_rerror_rate: 0.0, same_srv_rate: 1.0, diff_srv_rate: 0.0, srv_diff_host_rate: 0.0, dst_host_count: 1, dst_host_srv_count: 1, dst_host_same_srv_rate: 1.0, dst_host_diff_srv_rate: 0.0, dst_host_same_src_port_rate: 1.0, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0, dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 0.0, dst_host_srv_rerror_rate: 0.0 },
  },
];

export const TRAFFIC_TIMELINE = [
  { time: "00:00", normal: 4200, dos: 12, probe: 3, r2l: 0, u2r: 0 },
  { time: "02:00", normal: 3100, dos: 8, probe: 2, r2l: 1, u2r: 0 },
  { time: "04:00", normal: 2400, dos: 6, probe: 1, r2l: 0, u2r: 0 },
  { time: "06:00", normal: 3800, dos: 45, probe: 8, r2l: 2, u2r: 1 },
  { time: "08:00", normal: 6200, dos: 321, probe: 67, r2l: 12, u2r: 3 },
  { time: "10:00", normal: 8900, dos: 89, probe: 23, r2l: 5, u2r: 0 },
  { time: "12:00", normal: 9400, dos: 512, probe: 44, r2l: 8, u2r: 2 },
  { time: "14:00", normal: 8700, dos: 178, probe: 31, r2l: 11, u2r: 1 },
  { time: "16:00", normal: 7800, dos: 66, probe: 19, r2l: 4, u2r: 0 },
  { time: "18:00", normal: 7100, dos: 234, probe: 52, r2l: 9, u2r: 4 },
  { time: "20:00", normal: 5900, dos: 143, probe: 28, r2l: 6, u2r: 0 },
  { time: "22:00", normal: 4600, dos: 77, probe: 15, r2l: 3, u2r: 1 },
];

export const ATTACK_DISTRIBUTION = [
  { name: "DoS", value: 7458, color: "#f43f5e" },
  { name: "Probe", value: 2304, color: "#22d3ee" },
  { name: "R2L", value: 895, color: "#fbbf24" },
  { name: "U2R", value: 52, color: "#a78bfa" },
];

export const MOCK_RULES = [
  { id: "RUL-001", name: "Block Neptune DoS Source", type: "block", src_ip: "203.0.113.47", protocol: "tcp", port: 80, enabled: true, created_at: "2026-03-29T09:20:00Z", description: "Automatically blocked after DoS pattern detected", hits: 14821 },
  { id: "RUL-002", name: "Whitelist Internal Monitor", type: "whitelist", src_ip: "10.0.0.254", protocol: "any", port: "any", enabled: true, created_at: "2026-03-01T00:00:00Z", description: "Internal monitoring system bypass", hits: 45902 },
  { id: "RUL-003", name: "Block ICMP Flood Range", type: "block", src_ip: "172.16.0.0/24", protocol: "icmp", port: "any", enabled: true, created_at: "2026-03-28T16:45:00Z", description: "Blocking ICMP flood from subnet after Smurf detection", hits: 89234 },
  { id: "RUL-004", name: "Allow DNS Resolution", type: "allow", protocol: "udp", port: 53, enabled: true, created_at: "2026-01-15T00:00:00Z", description: "Allow legitimate DNS traffic", hits: 234012 },
  { id: "RUL-005", name: "Block Port Scan Source", type: "block", src_ip: "203.0.113.55", protocol: "tcp", port: "any", enabled: false, created_at: "2026-03-29T08:45:00Z", description: "Blocked IP performing port sweeps (disabled — under review)", hits: 421 },
  { id: "RUL-006", name: "Block FTP Write Attempts", type: "block", protocol: "tcp", port: 21, enabled: true, created_at: "2026-03-20T12:00:00Z", description: "Block unauthorized FTP write connections", hits: 1843 },
];

export const MOCK_MODELS = [
  { id: "MDL-001", name: "Random Forest Classifier", version: "v2.3", algorithm: "Random Forest", accuracy: 0.9927, precision: 0.9918, recall: 0.9934, f1_score: 0.9926, trained_on: "2026-03-01T00:00:00Z", deployed_at: "2026-03-15T09:00:00Z", is_active: true, confusion_matrix: [[9711,18,5,2,0],[12,3421,8,0,1],[4,7,1089,2,0],[1,0,3,312,0],[0,1,0,0,22]], feature_importance: [{feature:"dst_host_serror_rate",importance:0.142},{feature:"serror_rate",importance:0.138},{feature:"count",importance:0.121},{feature:"srv_serror_rate",importance:0.118},{feature:"dst_host_srv_serror_rate",importance:0.107},{feature:"src_bytes",importance:0.089},{feature:"dst_bytes",importance:0.075},{feature:"same_srv_rate",importance:0.064},{feature:"dst_host_count",importance:0.051},{feature:"flag",importance:0.048}] },
  { id: "MDL-002", name: "XGBoost Classifier", version: "v1.8", algorithm: "XGBoost", accuracy: 0.9889, precision: 0.9875, recall: 0.9901, f1_score: 0.9888, trained_on: "2026-02-15T00:00:00Z", deployed_at: "2026-02-20T10:00:00Z", is_active: false, confusion_matrix: [[9688,25,9,5,2],[18,3408,12,3,1],[7,11,1078,5,1],[2,1,6,307,0],[0,2,0,0,21]], feature_importance: [{feature:"dst_host_serror_rate",importance:0.158},{feature:"serror_rate",importance:0.131},{feature:"src_bytes",importance:0.112},{feature:"count",importance:0.105},{feature:"srv_count",importance:0.093},{feature:"srv_serror_rate",importance:0.087},{feature:"flag",importance:0.076},{feature:"dst_bytes",importance:0.069},{feature:"dst_host_count",importance:0.054},{feature:"protocol_type",importance:0.041}] },
  { id: "MDL-003", name: "Random Forest Classifier", version: "v2.1", algorithm: "Random Forest", accuracy: 0.9821, precision: 0.9808, recall: 0.9835, f1_score: 0.9821, trained_on: "2026-01-10T00:00:00Z", deployed_at: "2026-01-20T08:00:00Z", is_active: false, confusion_matrix: [[9654,41,17,8,3],[22,3398,18,5,2],[9,14,1069,8,2],[3,2,9,302,0],[0,2,1,0,20]], feature_importance: [] },
];

export const MOCK_DATASETS = [
  { id: "DS-001", name: "KDDTrain+.txt", type: "train", records: 125973, size_mb: 18.2, uploaded_at: "2026-03-01T00:00:00Z", status: "ready", normal_pct: 46.5, attack_pct: 53.5 },
  { id: "DS-002", name: "KDDTest+.txt", type: "test", records: 22544, size_mb: 3.3, uploaded_at: "2026-03-01T00:00:00Z", status: "ready", normal_pct: 43.1, attack_pct: 56.9 },
  { id: "DS-003", name: "live_capture_2026_03_29.pcap", type: "live", records: 14823, size_mb: 2.1, uploaded_at: "2026-03-29T00:00:00Z", status: "processing", normal_pct: 87.3, attack_pct: 12.7 },
  { id: "DS-004", name: "live_capture_2026_03_28.pcap", type: "live", records: 41204, size_mb: 5.8, uploaded_at: "2026-03-28T00:00:00Z", status: "ready", normal_pct: 91.2, attack_pct: 8.8 },
];

export const INITIAL_LOGS = [
  { timestamp: "09:14:22.341", level: "ALERT", source: "ML-ENGINE", message: "THREAT DETECTED: neptune (DoS) from 203.0.113.47 → confidence 97.2%" },
  { timestamp: "09:14:22.340", level: "INFO",  source: "PACKET-CAPTURE", message: "Captured 512 packets from interface eth0 in last 1s" },
  { timestamp: "09:14:21.890", level: "DEBUG", source: "FEATURE-EXT", message: "Extracted 41 KDD features from flow batch #8821" },
  { timestamp: "09:14:21.112", level: "INFO",  source: "ML-ENGINE", message: "RandomForest v2.3 inference: 511 packets → 511 DoS (neptune)" },
  { timestamp: "09:13:58.221", level: "WARN",  source: "NET-MONITOR", message: "Anomalous SYN rate: 511/s on eth0 (threshold: 100/s)" },
  { timestamp: "09:12:05.440", level: "ALERT", source: "ML-ENGINE", message: "THREAT DETECTED: ftp_write (R2L) from 198.51.100.22 → confidence 89.1%" },
  { timestamp: "09:12:05.120", level: "INFO",  source: "FIREWALL",  message: "Rule RUL-001 applied: blocked 14821 packets from 203.0.113.47" },
  { timestamp: "09:08:33.001", level: "ALERT", source: "ML-ENGINE", message: "THREAT DETECTED: ipsweep (Probe) from 192.0.2.88 → confidence 93.4%" },
  { timestamp: "09:05:11.772", level: "ALERT", source: "ML-ENGINE", message: "THREAT DETECTED: buffer_overflow (U2R) from 203.0.113.9 → confidence 91.3%" },
  { timestamp: "09:05:00.000", level: "INFO",  source: "IDS-SYSTEM", message: "IDS Sentinel v3.1.0 — Detection engine started successfully" },
  { timestamp: "09:04:58.121", level: "INFO",  source: "ML-ENGINE", message: "Model RandomForest v2.3 loaded — 99.27% accuracy on KDDTest+" },
  { timestamp: "09:04:57.880", level: "INFO",  source: "DB",        message: "SQLite database connected — 3 tables initialized" },
  { timestamp: "09:04:55.001", level: "DEBUG", source: "CONFIG",    message: "Loaded config: threshold=0.75, batch_size=512, interface=eth0" },
];

export const DASHBOARD_STATS = {
  total_traffic: 125973, malicious_hits: 10709, model_confidence: 99.27,
  alerts_today: 12, critical_alerts: 4, resolved_today: 3,
  categories: { DoS: 7458, Probe: 2304, R2L: 895, U2R: 52 },
};
