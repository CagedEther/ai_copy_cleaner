import { existsSync, readFileSync } from 'node:fs';

const cardPath = 'agent-card.json';
const card = JSON.parse(readFileSync(cardPath, 'utf8'));
const failures = [];

if (!card.identity?.agentName) failures.push('identity.agentName is required');
if (!card.identity?.displayName) failures.push('identity.displayName is required');
if (!Array.isArray(card.capabilities?.taskKinds)) failures.push('capabilities.taskKinds must be an array');
if (!Array.isArray(card.io?.inputs) || card.io.inputs.length === 0) failures.push('io.inputs must define at least one input');
if (!Array.isArray(card.io?.outputs) || card.io.outputs.length === 0) failures.push('io.outputs must define at least one output');
if (!card.runtime?.handler) failures.push('runtime.handler is required');

if (card.runtime?.handler && !existsSync(card.runtime.handler)) {
  failures.push(`runtime.handler does not exist: ${card.runtime.handler}`);
}

for (const input of card.io?.inputs ?? []) {
  if (!input.id) failures.push('each input needs an id');
  if (input.contentType === 'application/json' && !input.schema) {
    failures.push(`input ${input.id ?? '<unknown>'} needs a schema`);
  }
}

for (const output of card.io?.outputs ?? []) {
  if (!output.id) failures.push('each output needs an id');
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log(`Validated ${card.identity.displayName} (${card.identity.agentName})`);
