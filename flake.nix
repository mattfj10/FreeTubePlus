{
  description = "FreeTube development shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachSystem [ "x86_64-linux" "aarch64-linux" ] (system:
      let
        pkgs = import nixpkgs { inherit system; };
        electronLibs = with pkgs; [
          alsa-lib
          at-spi2-atk
          atk
          cairo
          cups
          dbus
          expat
          gtk3
          libdrm
          libnotify
          libsecret
          libxkbcommon
          mesa
          nspr
          nss
          pango
          wayland
          libx11
          libxcomposite
          libxcursor
          libxdamage
          libxext
          libxfixes
          libxi
          libxrandr
          libxrender
          libxscrnsaver
          libxtst
        ];
      in
      {
        apps.default = {
          type = "app";
          program = toString (pkgs.writeShellScript "freetube-run" ''
            set -euo pipefail
            shopt -s nullglob

            if [[ -f "''${PWD}/flake.nix" ]]; then
              ROOT="''${PWD}"
            else
              ROOT=$(${pkgs.git}/bin/git -C "''${PWD}" rev-parse --show-toplevel 2>/dev/null || true)
            fi
            if [[ -z "''${ROOT}" || ! -f "''${ROOT}/flake.nix" ]]; then
              echo "Run this from the FreeTube repository (directory containing flake.nix)." >&2
              exit 1
            fi
            cd "''${ROOT}"

            echo "Building FreeTube (yarn install + yarn build in nix develop)…" >&2
            ${pkgs.nix}/bin/nix develop "''${ROOT}" --accept-flake-config -c bash -lc "export USE_SYSTEM_FPM=true; yarn install --frozen-lockfile && yarn build"

            appimage=""
            best=0
            for f in build/FreeTube-*.AppImage; do
              [[ -f "$f" ]] || continue
              t=$(${pkgs.coreutils}/bin/stat -c %Y "$f")
              if (( t > best )); then best=$t; appimage="$f"; fi
            done
            if [[ -z "$appimage" ]]; then
              echo "Build finished but no AppImage matching build/FreeTube-*.AppImage was found." >&2
              exit 1
            fi
            echo "Launching $appimage" >&2
            exec ${pkgs.appimage-run}/bin/appimage-run "$appimage"
          '');
        };

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            yarn
            python3
            git
            cacert
            openssl
            pkg-config

            # Packaging / artifact tooling.
            appimage-run
            dpkg
            fakeroot
            fuse
            fuse3
            p7zip
            patchelf
            rpm
            fpm
            libarchive
            unzip
            zip

            # Visualization / docs tooling.
            graphviz
          ] ++ electronLibs;

          shellHook = ''
            unset ELECTRON_SKIP_BINARY_DOWNLOAD
            export npm_config_build_from_source=false
            export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath electronLibs}:$LD_LIBRARY_PATH"

            echo "FreeTube dev shell ready"
            echo "Node: $(node --version)"
            echo "Yarn: $(yarn --version)"
          '';
        };
      });
}
