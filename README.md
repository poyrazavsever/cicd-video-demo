# GitHub Actions + Hostinger VPS — Çekim ve uygulama rehberi

Bu paket, Poyraz Avsever'in başlangıç seviyesine yönelik CI/CD videosu için hazırlanmıştır.
Küçük bir indirim hesaplayıcıyı test eder, Vite ile build alır ve Nginx'e yayınlar.
Node.js 24; Vite 8.0.0; Ubuntu 24.04; standart SSH portu 22 varsayılır.
Sunucu komutları YENİ, bu demo için ayrılmış VPS içindir. Mevcut siteli sunucuda varsayılan Nginx yapılandırmasını değiştirmeyin.
Gerçek VPS/GitHub hesabınıza bu paket hazırlanırken bağlantı veya deployment yapılmamıştır.

## Nerede ne çalışıyor?

- Bilgisayar: kodu yazıp yerel test yaparsınız.
- GitHub runner: her main push'unda npm ci, npm test, npm run build çalışır.
- Hostinger VPS: Nginx, üretilen HTML/CSS/JS dosyalarını sunar.
- Node.js VPS'e kurulmaz; bu demo statik frontend'dir. Backend/SSR uygulamaları ayrıca çalışma ortamı gerektirir.
- Bu ilk ders alan adı gerektirmez: http://SUNUCU_IP. Gerçek yayınınızda alan adı ve HTTPS ekleyin.

## 1. Kavramları anlat (45–60 saniye)

CI: Değişiklikleri sık sık ortak kod tabanına entegre ederken otomatik test ve build kontrolleri çalıştırma pratiği.
CD: Continuous Delivery'de yayınlanabilir sürüm hazırlanır, canlıya geçiş manuel onaylı olabilir. Continuous Deployment'ta başarılı değişiklikler otomatik yayınlanır. Bu örnek ikincisini gösterir.
GitHub Actions: Sürecimizi çalıştıran otomasyon sistemi. Workflow bütün tarif; job bir iş grubu; step tek adım; runner bunları çalıştıran makinedir.
Tek geliştiricili demo CI'nın otomatik doğrulama bölümünü gösterir. Takım çalışmasında PR kontrolleri ve korunan main dalı eklenir.

## 2. Projeyi bilgisayarda aç

Windows'ta Git Bash; macOS/Linux'ta terminal kullan. Node.js 24 ve Git kurulu olsun.

```bash
node -v
npm -v
git --version
cd cicd-video-demo
npm ci
npm run dev
```

Terminalin verdiği localhost adresini aç. 1000 TL / yüzde 20 için 800 TL gör.
Ctrl+C geliştirme sunucusunu durdurur. Sonraki komutlar için ikinci terminal de açabilirsin.
Paket lock dosyası içerir; sıfırdan aynı package.json'ı yazıyorsan ilk sefer npm install kullanıp oluşan package-lock.json'ı commit et.

Anlat: “Koddan yayına giden kısmı rahat takip edebilmek için küçük bir uygulama kullanıyorum.”

## 3. Testi göster

src/discount.js uygulamanın gerçekten kullandığı hesaplama fonksiyonudur.
test/discount.test.js bu fonksiyonu import eder ve 6 davranışı kontrol eder.
En kolay anlatılacak örnek: calculateDiscount(1000, 20) sonucu 800 olmalı.

```bash
npm test
npm run build
npm run preview
```

npm test Node'un yerleşik test aracını çalıştırır. npm run build Vite ile dist/ oluşturur.
npm run preview sadece yerel kontrol içindir; internete açık production sunucusu olarak kullanılmaz.
Testlerin geçmesi UI, güvenlik veya bütün olası hataların doğrulandığı anlamına gelmez.

## 4. GitHub deposunu aç — ilk push'u henüz yapma

GitHub'da boş cicd-video-demo deposu oluştur. README, lisans veya gitignore ekletme.
Bilgisayarda paket klasörünün içinde:

```bash
git init
git branch -M main
git add .
git commit -m "Add CI/CD demo"
git remote add origin https://github.com/KULLANICI_ADIN/cicd-video-demo.git
```

KULLANICI_ADIN yerini değiştir. Henüz push yapma; önce sunucu ve secrets hazırlansın.
Git kimlik bilgisi sorarsa kendi adın/e-postanla repo seviyesinde git config user.name ve user.email ayarla.
GitHub kimlik doğrulamasında Git Credential Manager/tarayıcı girişini kullan; hesap parolasıyla HTTPS push yapılmaz.

## 5. Hostinger'a geçiş

Anlat: “GitHub kodumuzu test edip yayına hazırlayacak. Uygulamanın erişilebilir kalması için de bir sunucuya ihtiyacımız var. Bu videoda sponsorumuz Hostinger'ın VPS'ini kullanıyorum.”
Yeni Ubuntu 24.04 VPS, IPv4 adresi ve yönetici erişimi hazır olsun. Fiyat/kupon uydurma; sana verilen sponsor bağlantısını kullan.
Başlangıç kurulumu panelin web terminalinde root olarak yapılabilir. Actions daha sonra sadece deploy kullanıcısıyla SSH üzerinden bağlanır.

## 6. Sunucuyu bir kez hazırla — VPS'te root terminal

```bash
apt-get update
apt-get install -y nginx curl openssh-server
systemctl enable --now nginx
systemctl enable --now ssh
adduser --disabled-password --gecos "" deploy
install -d -m 755 -o deploy -g deploy /var/www/cicd-demo
install -d -m 755 -o deploy -g deploy /var/www/cicd-demo/releases /var/www/cicd-demo/uploads
install -d -m 755 -o deploy -g deploy /var/www/cicd-demo/releases/initial
printf '%s\n' '<h1>Sunucu hazir. Ilk yayin bekleniyor.</h1>' > /var/www/cicd-demo/releases/initial/index.html
ln -s /var/www/cicd-demo/releases/initial /var/www/cicd-demo/current
chown -R deploy:deploy /var/www/cicd-demo
```

deploy kullanıcısına sudo yetkisi vermiyoruz. Kendi site klasörüne yazması yeterli.
Bu tek seferlik kurulumdur; aynı kullanıcı/symlink zaten varsa körlemesine tekrar çalıştırma.

Nginx yapılandırması:

```bash
cat > /etc/nginx/sites-available/cicd-demo <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/cicd-demo/current;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
        add_header Cache-Control "no-cache";
    }
}
EOF
unlink /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/cicd-demo /etc/nginx/sites-enabled/cicd-demo
nginx -t
```

Yalnızca nginx -t başarılıysa:

```bash
systemctl reload nginx
curl -I http://127.0.0.1
```

http://SUNUCU_IP açılınca başlangıç yazısı görünmeli. Nginx statik dosyaları HTTP üzerinden sunar.
Hostinger güvenlik duvarında TCP 80 ve SSH için TCP 22 erişimini kontrol et. GitHub runner'ının da 22'ye erişmesi gerekir.
UFW aktifse (ufw status): ufw allow 80/tcp; ufw allow 22/tcp. Bu rehber için mevcut firewall kurallarını sıfırlama.
SSH portun 22 değilse bu örneğin scp/ssh parametreleri ve known_hosts girdisi uyarlanmalı.

## 7. Actions'a özel SSH anahtarı — kendi bilgisayarında

Repo klasörü dışında ~/.ssh altında oluştur:

```bash
mkdir -p ~/.ssh
ssh-keygen -t ed25519 -C "github-actions-cicd-demo" -f ~/.ssh/cicd_demo_actions
```

Parola/passphrase sorusunda bu otomasyon anahtarı için Enter ile boş bırak; mevcut dosya uyarısı varsa üzerine yazma.
Public key dosyası cicd_demo_actions.pub; özel anahtar cicd_demo_actions.
Public key'i kopyala:

```bash
cat ~/.ssh/cicd_demo_actions.pub
```

VPS root terminalinde:

```bash
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
cat > /home/deploy/.ssh/authorized_keys <<'EOF'
restrict ssh-ed25519 BURAYA_PUBLIC_KEY github-actions-cicd-demo
EOF
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

Yer tutucu satırı komple değiştir: kopyalanan ssh-ed25519 ... public key satırının başına `restrict ` ekle. Bu satır tek satır olmalı.
restrict PTY/port forwarding gibi yetkileri sınırlar; deployment için gereken komut çalıştırma ve dosya aktarımı sürer.
Yeni kullanıcı varsayımıyla dosya yazılır; mevcut bir kullanıcının authorized_keys dosyasını ezme.

## 8. Sunucunun kimliğini doğrula ve secrets ekle

Hostinger'ın güvendiğin web terminalinde (SUNUCU_IP yerini gerçek IPv4 ile değiştir):

```bash
printf '%s ' 'SUNUCU_IP'
cut -d ' ' -f 1,2 /etc/ssh/ssh_host_ed25519_key.pub
```

Tek satır sonuç şu biçimdedir: SUNUCU_IP ssh-ed25519 AAAA...
Bu sunucunun PUBLIC host anahtarıdır; deploy kullanıcısı için ürettiğin public key ile farklıdır.

GitHub: Repository > Settings > Secrets and variables > Actions > New repository secret.

| Secret | Değer |
| --- | --- |
| VPS_HOST | Sadece IPv4; http:// ve port ekleme |
| VPS_SSH_KEY | Bilgisayarındaki cicd_demo_actions özel anahtarının bütün içeriği; BEGIN/END dahil |
| VPS_KNOWN_HOSTS | Güvenilir VPS terminalinden alınan IP + host public key satırı |

Özel anahtarı kod deposuna koyma ve çekimde gösterme. Ekran kaydını durdurup metin düzenleyiciden kopyalayabilirsin.
İsteğe bağlı bağlantı kontrolü: VPS_KNOWN_HOSTS satırını bilgisayarında ~/.ssh/cicd_demo_known_hosts dosyasına kaydet, ardından:

```bash
ssh -i ~/.ssh/cicd_demo_actions -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$HOME/.ssh/cicd_demo_known_hosts" deploy@SUNUCU_IP "whoami"
```

Beklenen sonuç deploy. Bu anahtardaki restrict nedeniyle interaktif kabuk yerine komut çalıştırıyoruz.
Sunucu sıfırlanırsa host anahtarı değişir: yeni değeri panelden doğrulayıp secret'ı güncelle; kontrolü kapatma.

## 9. Workflow'u anlat

Tam dosya .github/workflows/deploy.yml içindedir.

- on.push.branches: main: ana dala gönderim tetikler.
- permissions.contents: read: checkout için gerekli okuma yetkisi.
- concurrency: production: iki yayın aynı anda sürüm bağlantısını değiştirmesin. cancel-in-progress: false devam eden yayını kesmez; tüm ara push'ların sırayla yayınlanacağı garantisi değildir.
- runs-on: ubuntu-latest: GitHub'ın sağladığı geçici runner. VPS değil.
- checkout: repoyu runner'a indirir.
- setup-node: runner'a Node.js 24 hazırlar, npm cache ayarlar.
- npm ci: lock dosyasındaki bağımlılık sürümlerini kurar.
- npm test: gerçek hesaplama davranışını kontrol eder.
- npm run build: dist üretir.
- son step: dist'i tar.gz yapar, scp ile VPS'e yollar ve scripts/deploy.sh dosyasını SSH üzerinden çalıştırır.
- Test veya build başarısızsa sonraki normal step'ler çalışmaz. continue-on-error kullanılmıyor.

deploy.sh her yayını ayrı releases/ klasörüne açar, dosyalar hazır olunca current bağlantısını değiştirir.
Eski sürüm aktarım sırasında yerinde kalır. Bu tam kapsamlı sıfır kesinti garantisi değildir.
version.txt üzerinden Nginx'in yeni sürümü sunduğunu kontrol eder; bu kontrol başarısızsa önceki bağlantıya döner.
Bu HTTP kontrolü tarayıcı fonksiyonlarını test eden E2E testi değildir.
VPS'te npm install/build/git pull çalıştırılmaz. GitHub'da build edilen çıktıyı gönderiyoruz.

## 10. İlk push ve başarılı yayın

```bash
git push -u origin main
```

GitHub Actions sekmesini aç. Test, Build ve Deploy çalışmasını, ardından publish işini aç.
Altı testin geçtiğini, Vite'ın dist oluşturduğunu, deploy adımının başarılı olduğunu göster.
http://SUNUCU_IP aç: indirim hesaplayıcı ve 800 TL sonucu görünmeli.

Ardından index.html içindeki “İlk sürüm yayında.” metnini “Bu güncelleme GitHub Actions ile geldi.” olarak değiştir.

```bash
git add index.html
git commit -m "Update homepage message"
git push
```

Actions tamamlanınca siteyi yenile. “Tekrar sunucuya girip dosya kopyalamadım; push sonrasında süreç çalıştı.”

## 11. Bilerek boz, yayınlanmadığını göster

src/discount.js içindeki `1 - percent / 100` ifadesini `1 + percent / 100` yap.
Gerçek uygulama fonksiyonunu bozuyoruz; testi beklentisine uydurmuyoruz.
index.html metnini de “BU HATALI SÜRÜM YAYINLANMAMALI” yap; canlıda görünmemesi açıkça anlaşılır.
Yerelde npm test ile hatayı göster. Normalde başarısız testli kodu göndermezsin; burada kontrolün sunucuda da çalıştığını göstermek için bilerek gönderiyoruz.

```bash
git add src/discount.js index.html
git commit -m "demo: break discount calculation"
git push
```

Actions test aşamasında kırmızı olmalı. 1000 ve yüzde 20 için beklenen 800, hesaplanan 1200.
Build ve deploy skipped olur. Canlıda önceki başarılı yazı ve 800 TL sonucu kalır.
Anlat: “GitHub kodumu geri almadı. Hatalı commit depoda duruyor, ama canlıya yayınlanması engellendi.”

## 12. Hatayı düzelt

Yalnızca son commit bilerek bozduğun commit ise:

```bash
git revert --no-edit HEAD
git push
```

Bu komut hatalı commit'i tersine çeviren yeni commit oluşturur; git geçmişini silmez.
Son commit'in farklıysa `git log --oneline` ile demo hata commit'ini bulup onun hash'ini git revert'e ver.
Actions yeniden yeşil olur. Kapanışa geç.

## Çekim temposu (8–10 dakika)

0:00–0:30 giriş / sonuç; 0:30–1:30 CI/CD; 1:30–2:30 proje ve test;
2:30–4:00 sponsor, VPS ve bağlantı hazırlığı (beklemeleri kes);
4:00–6:00 workflow; 6:00–7:15 başarılı yayın;
7:15–8:45 hatalı test ve düzeltme; 8:45–9:15 kapanış.
Projenin CSS'ini, paket indirmelerini ve gizli anahtar yapıştırmayı tam süre gösterme.
Kurulumu çekimden önce prova et. Videoda nedenleri anlat, terminal beklemelerini kısalt.

## Sık karşılaşılan hatalar

| Belirti | Kontrol |
| --- | --- |
| Workflow görünmüyor | .github/workflows/deploy.yml ve main push |
| npm ci hata veriyor | package-lock.json commit edilmiş ve package.json ile uyumlu mu? |
| Permission denied (publickey) | deploy kullanıcısı, public/private eşleşmesi, .ssh 700 ve authorized_keys 600 |
| Host key verification failed | IP eşleşmesi, known_hosts satırı, sunucu sıfırlanması |
| SSH timeout | VPS IP, TCP 22 ve sağlayıcı/OS firewall |
| Nginx welcome sayfası | enabled config ve default site |
| Nginx 403 | current hedefi, index.html, klasörlerin okuma/geçiş izinleri |
| Site açılmıyor | TCP 80, nginx -t, systemctl status nginx |
| Eski yazı görünüyor | Actions tamamlandı mı, doğru IP mi, tarayıcıyı zorla yeniledin mi? |

## Kapsam

Bu eğitim main push -> test -> build -> deploy akışını gösterir. Üretim ortamında PR kontrolleri, dal koruması, gerektiğinde onay, alan adı/HTTPS, kapsamlı testler ve eski sürümleri temizleme politikası eklenir. Eski releases klasörleri bu demoda korunur; uzun süre kullanılırsa disk yönetimi gerekir.

## Resmî başvuru kaynakları

- https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
- https://docs.github.com/en/actions/reference/workflows-and-actions/expressions
- https://github.com/actions/checkout
- https://github.com/actions/setup-node
- https://vite.dev/guide/
- https://nodejs.org/api/test.html
- https://nginx.org/en/docs/beginners_guide.html

## Paket doğrulaması

Node.js 24 ortamında npm ci, 6 test ve Vite build başarılı. Bilerek eklenen hesaplama hatası testleri başarısız yapıyor. Deploy betiğinin sürüm değiştirme ve rollback davranışı geçici klasörlerde, taklit HTTP yanıtıyla doğrulandı. Gerçek GitHub Actions çalışması, SSH bağlantısı ve VPS/Nginx erişimi kullanıcı ortamında prova edilmelidir.
