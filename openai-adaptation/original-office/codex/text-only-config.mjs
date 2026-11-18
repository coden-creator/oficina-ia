// Pinned to public @openai/codex 0.167.0-alpha.4. Defense in depth, NOT a proof of isolation.
export const DISABLED_FEATURES = Object.freeze(['shell_tool','unified_exec','unified_exec_tty','shell_snapshot','apps','plugins','remote_plugin','memories','multi_agent','multi_agent_v2','hooks','browser_use','browser_use_external','browser_use_full_cdp_access','computer_use','code_mode','code_mode_host','artifact','request_permissions_tool','skill_mcp_dependency_install','skill_search','goals','view_image']);
export const TEXT_ONLY_CONFIG = Object.freeze({
 web_search:'disabled',mcp_servers:{},allow_login_shell:false,
 features:Object.fromEntries(DISABLED_FEATURES.map(k=>[k,false]))
});
export function textOnlyArgs({printConfig=false}={}) {
 const a=['app-server','--strict-config'];
 for(const f of DISABLED_FEATURES)a.push('--disable',f);
 a.push('-c','web_search="disabled"','-c','mcp_servers={}','-c','allow_login_shell=false');
 if(printConfig)a.push('--print-startup-config');else a.push('--listen','stdio://');
 return a;
}
