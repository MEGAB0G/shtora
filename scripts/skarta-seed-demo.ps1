param(
  [Parameter(Mandatory = $false)]
  [string]$BaseUrl = "https://romankovich.ru"
)

$ErrorActionPreference = "Stop"

function ApiJson($Method, $Url, $Body = $null, $WebSession = $null) {
  $params = @{
    Method      = $Method
    Uri         = $Url
    Headers     = @{ "Content-Type" = "application/json" }
    ErrorAction = "Stop"
  }
  if ($null -ne $Body) { $params.Body = ($Body | ConvertTo-Json -Depth 10) }
  if ($null -ne $WebSession) { $params.WebSession = $WebSession }
  $res = Invoke-RestMethod @params
  return $res
}

$demo = @(
  @{
    email    = "expert1@skarta.local"
    password = "SkartaDemo!1"
    name     = "Claire D."
    country  = "Франция"
    city     = "Paris"
    languages = "Français, English, Русский"
    topics   = "Еда, Безопасность, Транспорт"
    price    = 18
    about    = "Живу в Париже. Подскажу районы, безопасность и лайфхаки по транспорту."
  },
  @{
    email    = "expert2@skarta.local"
    password = "SkartaDemo!2"
    name     = "Nok S."
    country  = "Таиланд"
    city     = "Bangkok / Phuket"
    languages = "ไทย, English, Русский"
    topics   = "Пляжи, Транспорт, Ночная жизнь"
    price    = 12
    about    = "Маршруты, острова/пляжи, транспорт и практические советы без воды."
  },
  @{
    email    = "expert3@skarta.local"
    password = "SkartaDemo!3"
    name     = "Hiro K."
    country  = "Япония"
    city     = "Tokyo"
    languages = "日本語, English"
    topics   = "Транспорт, Еда, Семья"
    price    = 25
    about    = "Токио: транспорт, районы, семейные места и еда без переплат."
  },
  @{
    email    = "expert4@skarta.local"
    password = "SkartaDemo!4"
    name     = "Sam R."
    country  = "США"
    city     = "New York"
    languages = "English, Русский"
    topics   = "Безопасность, Отели, Транспорт"
    price    = 20
    about    = "NYC без стресса: районы, жильё, безопасность и перемещения."
  },
  @{
    email    = "expert5@skarta.local"
    password = "SkartaDemo!5"
    name     = "Mehmet A."
    country  = "Турция"
    city     = "Istanbul"
    languages = "Türkçe, English, Русский"
    topics   = "Еда, Транспорт, Безопасность"
    price    = 14
    about    = "Стамбул: районы, транспорт, что стоит/не стоит делать туристу."
  },
  @{
    email    = "expert6@skarta.local"
    password = "SkartaDemo!6"
    name     = "Lina M."
    country  = "Испания"
    city     = "Barcelona"
    languages = "Español, English, Русский"
    topics   = "Еда, Пляжи, Ночная жизнь"
    price    = 16
    about    = "Барселона: пляжи, районы, ночная жизнь и как не переплатить."
  }
)

Write-Host "BaseUrl: $BaseUrl"
Write-Host "Creating demo experts (idempotent where possible)..."

foreach ($d in $demo) {
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

  try {
    # Register (may fail if exists)
    ApiJson POST "$BaseUrl/api/skarta/auth/register" @{ name = $d.name; email = $d.email; password = $d.password } $session | Out-Null
  } catch {
    # If already exists, login
    ApiJson POST "$BaseUrl/api/skarta/auth/login" @{ email = $d.email; password = $d.password } $session | Out-Null
  }

  # Create/update expert profile
  ApiJson POST "$BaseUrl/api/skarta/experts" @{
    name      = $d.name
    country   = $d.country
    city      = $d.city
    languages = $d.languages
    topics    = $d.topics
    price     = $d.price
    about     = $d.about
    avatar    = ""
  } $session | Out-Null

  # Logout
  try { ApiJson POST "$BaseUrl/api/skarta/auth/logout" @{} $session | Out-Null } catch {}

  Write-Host ("OK: {0} / {1}" -f $d.email, $d.password)
}

Write-Host "Done."

