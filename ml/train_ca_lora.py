"""
===============================================================================
EZFINANCE FYP — PERSONAL CA MODEL FINE-TUNING (QLoRA + Unsloth / HuggingFace)
===============================================================================
Trains a domain-specialized Pakistani Chartered Accountant LLM adapter on top of
Qwen-2.5-7B-Instruct (or Meta-Llama-3.1-8B-Instruct) conditioned on the user's
structured Cross-App MEMORY_BANK.

How to run on Google Colab (Free T4 GPU):
  1. !pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
  2. !pip install --no-deps trl peft accelerate bitsandbytes
  3. Upload `pakistani_ca_dataset.jsonl` and run `python train_ca_lora.py`
"""

import json
import torch
from datasets import Dataset
from trl import SFTTrainer
from transformers import TrainingArguments
from unsloth import FastLanguageModel

# 1. Model & Quantization Configuration
BASE_MODEL = "unsloth/Qwen2.5-7B-Instruct-bnb-4bit"
MAX_SEQ_LENGTH = 2048
OUTPUT_DIR = "./ezfinance-ca-lora-adapter"

PROMPT_TEMPLATE = """Below is an instruction describing a Pakistani Chartered Accountant task, paired with the user's live EzFinance MEMORY_BANK and question. Write an accurate financial response calculated strictly from the user's numbers.

### Instruction:
{instruction}

### Input:
{input}

### Response:
{output}"""


def load_ca_dataset(jsonl_path: str, eos_token: str) -> Dataset:
    records = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            row = json.loads(line)
            text = PROMPT_TEMPLATE.format(
                instruction=row["instruction"],
                input=row["input"],
                output=row["output"],
            ) + eos_token
            records.append({"text": text})
    return Dataset.from_list(records)


def main():
    print(f"Loading 4-bit base model: {BASE_MODEL}...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=BASE_MODEL,
        max_seq_length=MAX_SEQ_LENGTH,
        dtype=None,
        load_in_4bit=True,
    )

    # 2. Attach QLoRA Adapters (Rank r=16)
    model = FastLanguageModel.get_peft_model(
        model,
        r=16,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        lora_alpha=16,
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=3407,
    )

    dataset = load_ca_dataset("pakistani_ca_dataset.jsonl", tokenizer.eos_token)
    print(f"Loaded {len(dataset)} Pakistani CA training examples.")

    # 3. Supervised Fine-Tuning (SFT)
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=MAX_SEQ_LENGTH,
        dataset_num_proc=2,
        packing=False,
        args=TrainingArguments(
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            warmup_steps=5,
            max_steps=60,
            learning_rate=2e-4,
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            logging_steps=5,
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="linear",
            seed=3407,
            output_dir=OUTPUT_DIR,
        ),
    )

    trainer_stats = trainer.train()
    print("Training complete!", trainer_stats)

    # 4. Save LoRA Adapter Weights & Tokenizer
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print(f"Saved EzFinance Personal CA LoRA adapter to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
