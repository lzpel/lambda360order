# Makefile for sandbox-opencascade-rs

# Variables
CARGO_BIN := sandbox-opencascade-rs
# Assuming running from sandbox-opencascade-rs directory
INPUT_STEP := ../public/PA-001-DF7.STEP
INPUT_BREP := ../public/PA-001-DF7.brep
OUT_JSON := ../public/out.json

# Speedtest output directories
OUT_DIR := out
CACHE_BREP := $(OUT_DIR)/cache.brep
OUT_STL_FROM_STEP := $(OUT_DIR)/step_out.stl
OUT_STL_FROM_BREP := $(OUT_DIR)/brep_out.stl

%:
	@echo "no target $*"
# Public Assets Generation
# 1. Setup: STEP -> BREP (Cache creation in public)
generate: 
	@echo "=== Generating BREP from STEP (Setup) ==="
	time cargo run --release --bin $(CARGO_BIN) -- $(INPUT_STEP) $(INPUT_BREP)
	@echo "=== Generating JSON from BREP ==="
	time cargo run --release --bin $(CARGO_BIN) -- $(INPUT_BREP) $(OUT_JSON)

# Speedtest target
speedtest: generate
	@echo "=== Speed Test: STEP -> STL ==="
	time cargo run --release --bin $(CARGO_BIN) -- $(INPUT_STEP) $(OUT_STL_FROM_STEP)
	@echo ""
	@echo "=== Speed Test: BRep -> STL ==="
	time cargo run --release --bin $(CARGO_BIN) -- $(INPUT_BREP) $(OUT_STL_FROM_BREP)