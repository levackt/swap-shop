.PHONY: all build clean find-floating-points

all: build

build:
	RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown
	wasm-opt -Oz ./target/wasm32-unknown-unknown/release/*.wasm -o ./contract.wasm
	cat ./contract.wasm | gzip -9 > ./contract.wasm.gz 

find-floating-points:
	cargo build --release --target wasm32-unknown-unknown
	twiggy paths ./target/wasm32-unknown-unknown/release/*.wasm > find_floats_twiggy.txt
	wasm2wat ./target/wasm32-unknown-unknown/release/*.wasm | grep -B 20 -P 'f(64|32)' > find_floats_grep.txt

clean:
	cargo clean
	-rm -f ./contract.wasm ./contract.wasm.gz
