RED='\033[0;31m'
BBLUE='\033[1;34m'
PURPLE='\033[0;35m'
UPURPLE='\033[4;35m'
IGREEN='\033[0;92m'
NC='\033[0m' # No Color
echo -e "Welcome, ${BBLUE}*${IGREEN}Wandering Crow${BBLUE}*"

# aliases
alias g="~/Documents/GitHub/"
alias gs="git status"
alias gb="git branch"

# zsh fish things
setopt auto_cd
plugins=(git zsh-syntax-highlighting zsh-autosuggestions)
autoload -Uz vcs_info
precmd() { vcs_info }

zstyle ':vcs_info:git:*' formats '%b '

setopt PROMPT_SUBST
PROMPT='%F{cyan}%~%f %F{blue}${vcs_info_msg_0_}%f$ '

# PATHS
export PATH=/opt/homebrew/bin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin
