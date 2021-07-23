import subprocess


def build():
    print("Building LaPoL.")

    # Build lapol-rs
    print("Building lapol-rs. Rust toolchain + wasm-pack required."
          " This may take a little while...")

    # shell=True works around https://bugs.python.org/issue17023 (In windows)
    # See https://stackoverflow.com/questions/42572582/winerror-2-the-system-cannot-find-the-file-specified-python
    p = subprocess.Popen(["wasm-pack", "build", "--target", "nodejs"],
                         cwd="lapol-rs",
                         shell=True)
    p.wait()
    print("Finished building lapol-rs.")

    print("Installing node (NPM) dependencies for lapol-core."
          " This may take some time.")
    p2 = subprocess.Popen(["npm", "install"],
                          cwd="lapol-core",
                          shell=True)
    p2.wait()
    print("Finished downloading node dependencies")

    print("Building lapol-core. This may take a little while more...")
    p3 = subprocess.Popen(["tsc"],
                          cwd="lapol-core",
                          shell=True)
    p3.wait()

    print("Finished building lapol-core.")


build()
