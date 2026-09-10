# Halliste Põhikooli tunniplaan — GitHub Pages

See versioon kasutab uusimat sinise liikuva ajajoonega tunniplaani. PDF-ist
uuendamine toimub brauseris; Pythonit ega muud serverirakendust pole vaja.
PDF-i sisu ei saadeta serverisse. Mõlemad HTML-failid sisaldavad oma vajalikku
koodi, sealhulgas uuendaja PDF.js-lugejat; välist CDN-i ei kasutata.

## Esmakordne GitHubi üleslaadimine

1. Kool loob või valib sobiva GitHubi konto. Hoidla võiks olla kooli kontrolli all.
2. Loo uus **public** hoidla nimega `tunniplaan`; alguses võib lisada README.
3. Laadi hoidla **juurkausta** järgmised failid kaustast `dist`:
   - `index.html` — avalik tunniplaan koos algse PDF-iga;
   - `uuenda.html` — PDF-ist uuendamise tööriist;
   - `PDFJS-LICENSE.txt` — PDF.js teegi litsents;
   - `.nojekyll` — tühi fail Jekylli töötlemise väljalülitamiseks.
4. Vali **Settings → Pages → Deploy from a branch → main → /(root) → Save**.
5. Ava Pagesi seadetes kuvatud aadress ja kontrolli mõlemat lehte.
   Avaldamine võib võtta mitu minutit.

Näide (asenda kasutajanimi tegelikuga):
`https://KASUTAJANIMI.github.io/tunniplaan/`
Muutmistööriist on sama aadressi järel `uuenda.html`.

Tunniplaani muudatusi avaldab ainult hoidla kirjutamisõigusega GitHubi kasutaja.
Muutmisleht ise ei ole parooliga kaitstud, kuid ei saa ühtegi veebifaili muuta.
See loob ainult allalaaditava faili kasutaja enda arvutisse.

## Iga järgmine tunniplaani uuendus

1. Ava `uuenda.html` brauseris (võib avada ka arvutisse laaditud failina).
2. Vali PDF ja vajuta **Loe PDF-ist tunnid**.
3. Ava algne PDF võrdlemiseks. Paranda vajadusel tabelilahtrid.
4. Kontrolli eraldi E, T, K, N, R; märgi iga päev kontrollituks.
   Päeva lahtri muutmisel tuleb see päev uuesti kinnitada.
5. Lisa tunniplaani pealkiri. Lisa eraldi tabelivälised märkused, nt avatud võimla.
6. Ava eelvaade. Kui andmed on korras, vali **Salvesta uus index.html**.
7. Hoia vanast HTML-failist varukoopia. Ava GitHubis hoidla, vali
   **Add file → Upload files** ning laadi uus `index.html` vana asemele.
   Kui brauser nimetas allalaaditud faili `index (1).html`, nimeta see enne
   üleslaadimist `index.html`-iks. Kinnita **Commit changes**.
8. Oota Pagesi avaldamise lõppu ja kontrolli avalikku tunniplaani.

PDF on avaliku HTML-faili sees. Seetõttu ei ole uut PDF-i vaja eraldi üles laadida
ning tabel ja algne PDF uuenevad koos. Käsitsi tehtud lahtriparandused muudavad
veebitabelit, mitte algfaili PDF-i. GitHub säilitab varasemad kinnitatud versioonid.

Juba salvestatud andmete parandamiseks vali muutmislehel „Soovin parandada juba
salvestatud tunniplaani” ja ava selle tööriistaga loodud index.html. Vana, enne
selle uuendaja loomist koostatud HTML ei sisalda uut andmeplokki: selle puhul
impordi algne PDF. Parandused ei salvestu automaatselt brauseri sulgemisel.

## Koolilehele lisamine

Esialgu võib kasutada GitHub Pagesi aadressi. Võimalik iframe'i näide:

```html
<iframe src="https://KASUTAJANIMI.github.io/tunniplaan/"
 title="Halliste Põhikooli tunniplaan"
 width="100%" height="1200" style="border:0;"></iframe>
```

Asenda näidisaadress tegelikuga. Kooli sisuhaldur peab iframe'i lubama; toimimist
kontrollida eelvaates. Võimalus avada tunniplaan eraldi aknas on telefonis kasulik.

Kui kool soovib aadressi `tunniplaan.halliste.vil.ee`, tuleb domeenihaldajaga kokku
leppida DNS CNAME suunamine konto `KASUTAJANIMI.github.io` aadressile (ilma
/tunniplaan/ teeta). Seadista GitHub Pagesis Custom domain ja Enforce HTTPS
ametliku juhendi järgi. Ära lisa CNAME-faili ega kooli domeeni enne, kui kool
on selle kasutuse ja DNS-i seadistuse kinnitanud.

## PDF-i piirid

Lugeja on kohandatud failile tunniplaan_sept26.pdf: joontega tabel, päises klassid
I–IX ning päevaplokid E/T/K/N/R. Lehekülgede vahel jätkuv tabel ja ühendatud
klassilahtrid on toetatud. Algfailiga testis leiti 299 mittetühja lahtrit ja
kõik 360 lahtrit vastasid varasema Python-lugeja tulemusele.

Toetatud on kuni 10 MB ja 10 lehekülge. Skannitud piltide OCR, parooliga PDF,
pööratud leheküljed ja täiesti teistsugune paigutus ei ole toetatud. Kujunduse
muutumisel võib olla vaja lugejat kohandada. Kõik päevad tuleb alati üle vaadata.
Impordil on 60 sekundi tähtaeg; väga keerukas PDF võib brauserit siiski koormata.

Kellaaegu ja 2026/2027. õppeaasta kalendrit PDF-ist ei loeta: need säilivad
senisest versioonist. Tabelivälised PDF-märkused ei impordi automaatselt.
8. tunni kellaaeg puudub ja sellel ei näidata ajajoont. Asendustundide kuupäevapõhine
haldus ja automaatne GitHubi avaldamine pole selles versioonis.

Kasuta tänapäevast brauserit. Tööriista allalaadimine ja faili loomine on lokaalne;
GitHubi avaldamiseks on vaja internetti ja konto õigusi. Kooli serveri ega DNS-i
seadeid pole selle paki loomisel muudetud.

## Arendajale

Juurkaust sisaldab taasehitatavat lähtekoodi ja lukustatud npm-sõltuvusi.
Avaldamiseks piisab `dist` failidest. Arendamiseks:

```sh
npm ci
npm run build
npm test
```

Testitud Node 24-ga. PDF.js on 6.3.289, esbuild 0.27.3. PDF-lugeja kood asub
`src/pdf-import.mjs`, ekspordi valideerimine `src/export.mjs`, avaliku lehe põhi
`src/public-template.html` ning algandmed `src/initial.json`. Taasehitamine loob
algandmetest uue dist/index.html, seega enne ehitamist säilita juba uuendatud
avalik fail või vii selle plan-data andmed initial.json-i.

Kontrollitud: algne PDF kõikide lahtrite kaupa, HTML-i eksport ja andmete taaslugemine,
PDF-i kaasapanek, imporditud teksti HTML-paokoodid, nädalavaate märgistus ja skriptide
süntaks. Brauseri visuaalset või täielikku klikkidega testi pole tehtud; enne kooli
kasutuselevõttu proovi PDF-importi, eelvaadet ja allalaadimist valitud brauseris.

## Ametlikud juhendid

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- Alam­domeen: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- PDF.js: https://mozilla.github.io/pdf.js/examples/
