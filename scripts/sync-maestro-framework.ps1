# Maestro Sync Framework Script
# Este script sincroniza a evolução dos agentes do projeto local DE VOLTA para a pasta do framework maestro-ai.

param (
    [string]$Action = "export", # export | push
    [string]$Message = "feat: evolução contínua dos agentes"
)

$rootDir = Get-Location
$frameworkDir = Join-Path $rootDir "maestro-ai"

if (-not (Test-Path $frameworkDir)) {
    Write-Host "ERRO: Pasta maestro-ai não encontrada na raiz!" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Iniciando sincronização do framework Maestro..." -ForegroundColor Cyan

if ($Action -eq "export") {
    Write-Host "📂 Exportando agentes e configurações evoluídas..." -ForegroundColor Yellow
    
    # 1. Copiar Agentes Específicos (e o novo AI Engineer)
    $srcAgents = Join-Path $rootDir ".gemini\agents"
    $dstAgents = Join-Path $frameworkDir ".gemini\agents"
    
    if (Test-Path $srcAgents) {
        # Copia todos e vamos limpar/revisar seletivamente via git status depois
        Copy-Item -Path "$srcAgents\*" -Destination $dstAgents -Recurse -Force
        Write-Host "✅ Agentes copiados para framework." -ForegroundColor Green
    }

    # 2. Copiar Regras Globais se existirem
    $srcRules = Join-Path $rootDir ".gemini\rules"
    $dstRules = Join-Path $frameworkDir ".gemini\rules"
    if (Test-Path $srcRules) {
        Copy-Item -Path "$srcRules\*" -Destination $dstRules -Recurse -Force
        Write-Host "✅ Regras evoluídas copiadas." -ForegroundColor Green
    }

    # 3. Atualizar template GEMINI.md a partir do local, limpando stack específica
    $srcGemini = Join-Path $rootDir "GEMINI.md"
    $dstGemini = Join-Path $frameworkDir "GEMINI.md"
    if (Test-Path $srcGemini) {
        $content = Get-Content $srcGemini -Raw
        # Preservar o AI Agent no template, mas limpar stack
        $content = $content -replace "Frontend  :.*", "Frontend  : [FRAMEWORK]"
        $content = $content -replace "Backend   :.*", "Backend   : [FRAMEWORK]"
        $content = $content -replace "Banco     :.*", "Banco     : [DATABASE]"
        $content = $content -replace "Infra     :.*", "Infra     : [INFRA]"
        $content = $content -replace "Testes    :.*", "Testes    : [TEST_FRAMEWORK]"
        Set-Content -Path $dstGemini -Value $content
        Write-Host "✅ Template GEMINI.md atualizado." -ForegroundColor Green
    }
}

if ($Action -eq "push") {
    Write-Host "🚀 Enviando alterações para o repositório maestro-ai..." -ForegroundColor Cyan
    Set-Location $frameworkDir
    git add .
    git commit -m "$Message"
    git push origin main
    Set-Location $rootDir
    Write-Host "🔥 Framework atualizado na nuvem com sucesso!" -ForegroundColor Green
}

Write-Host "✨ Sincronização concluída!" -ForegroundColor Cyan
