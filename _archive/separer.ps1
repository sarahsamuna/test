
$ErrorActionPreference = "Stop"

# Lire la sauvegarde originale : ne pas utiliser le fichier modifié
$src = Get-Content -Raw -Encoding UTF8 ".\sauvegarde_sms.html"

function Get-Part($pattern, $name) {
    $m = [regex]::Match($src, $pattern)
    if (-not $m.Success) {
        throw "Partie introuvable : $name"
    }
    return $m.Value
}

# Récupérer le CSS et le JavaScript originaux
$css = Get-Part '(?s)<style>(.*?)</style>' "CSS"
$js = Get-Part '(?s)<script>(.*?)</script>' "JavaScript"

$css = [regex]::Match($css, '(?s)<style>(.*?)</style>').Groups[1].Value
$js = [regex]::Match($js, '(?s)<script>(.*?)</script>').Groups[1].Value

Set-Content ".\style.css" $css -Encoding UTF8

# Adapter seulement les éléments qui n'existent pas sur toutes les pages
$js = $js.Replace("menuToggle.addEventListener(", "menuToggle?.addEventListener(")
$js = $js.Replace("navLinks.querySelectorAll('a').forEach", "navLinks?.querySelectorAll('a').forEach")
$js = $js.Replace("searchToggle.addEventListener(", "searchToggle?.addEventListener(")
$js = $js.Replace("document.getElementById('noResults').classList.toggle", "document.getElementById('noResults')?.classList.toggle")
$js = $js.Replace("document.getElementById('orderForm').addEventListener", "document.getElementById('orderForm')?.addEventListener")
$js = $js.Replace("document.getElementById('productChoice').value = link.dataset.product;", 'const choice = document.getElementById("productChoice"); if (choice) choice.value = link.dataset.product;')

Set-Content ".\script.js" $js -Encoding UTF8

# Récupérer les éléments communs du site
$head = Get-Part '(?s)\A.*?</head>' "En-tête HTML"
$head = [regex]::Replace($head, '(?is)<style>.*?</style>', '<link rel="stylesheet" href="style.css">', 1)

$header = Get-Part '(?s)<div class="announcement">.*?</header>' "Navigation"
$cart = Get-Part '(?s)<div class="cart-overlay".*?</aside>' "Panier"
$footer = Get-Part '(?s)<footer>.*?</footer>' "Pied de page"

# Transformer les liens du menu en liens entre les pages
$header = $header.Replace('href="#accueil"', 'href="index.html"')
$header = $header.Replace('href="#creations"', 'href="creations.html"')
$header = $header.Replace('href="#tarifs"', 'href="tarifs.html"')
$header = $header.Replace('href="#avis"', 'href="avis.html"')
$header = $header.Replace('href="#apropos"', 'href="apropos.html"')
$header = $header.Replace('href="#contact"', 'href="commander.html"')

$footer = $footer.Replace('href="#creations"', 'href="creations.html"')
$footer = $footer.Replace('href="#tarifs"', 'href="tarifs.html"')
$footer = $footer.Replace('href="#apropos"', 'href="apropos.html"')
$footer = $footer.Replace('href="#contact"', 'href="commander.html"')

# Récupérer chaque section originale
$sections = [ordered]@{
    "index.html" = Get-Part '(?s)<section class="hero" id="accueil">.*?</section>' "Accueil"
    "creations.html" = Get-Part '(?s)<section class="section" id="creations">.*?</section>' "Créations"
    "tarifs.html" = Get-Part '(?s)<section class="section" id="tarifs">.*?</section>' "Tarifs"
    "avis.html" = Get-Part '(?s)<section class="review-band" id="avis">.*?</section>' "Avis"
    "apropos.html" = Get-Part '(?s)<section class="section about" id="apropos">.*?</section>' "À propos"
}

# Ajouter la partie Comment commander à la page Commander
$processPos = $src.IndexOf('<div class="process"')
if ($processPos -lt 0) { throw "Partie Comment commander introuvable" }

$processStart = $src.LastIndexOf('<section', $processPos)
$processEnd = $src.IndexOf('</section>', $processPos) + 10
$process = $src.Substring($processStart, $processEnd - $processStart)

$contact = Get-Part '(?s)<section class="section" id="contact">.*?</section>' "Contact"
$sections["commander.html"] = $process + "`r`n" + $contact

# Générer les six pages
foreach ($entry in $sections.GetEnumerator()) {
    $content = $entry.Value

    $content = $content.Replace('href="#accueil"', 'href="index.html"')
    $content = $content.Replace('href="#creations"', 'href="creations.html"')
    $content = $content.Replace('href="#tarifs"', 'href="tarifs.html"')
    $content = $content.Replace('href="#avis"', 'href="avis.html"')
    $content = $content.Replace('href="#apropos"', 'href="apropos.html"')
    $content = $content.Replace('href="#contact"', 'href="commander.html"')

    $page = $head + "`r`n<body>`r`n<div id=`"app`">`r`n" +
            $header + "`r`n<main>`r`n" + $content +
            "`r`n</main>`r`n" + $cart + "`r`n" +
            $footer + "`r`n</div>`r`n" +
            '<script src="script.js"></script>' +
            "`r`n</body>`r`n</html>"

    Set-Content ".\$($entry.Key)" $page -Encoding UTF8
    Write-Host "Page créée : $($entry.Key)" -ForegroundColor Green
}

Write-Host "Séparation terminée !" -ForegroundColor Green
