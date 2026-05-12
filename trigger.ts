import 'dotenv/config';
import { TaskClient, textPart, decodeInlineArtifact } from '@blocks-network/sdk';
import type { ProgressEvent } from '@blocks-network/sdk';

/**
 * Trigger a task on the ai_copy_cleaner_h7p9 agent and print the result.
 * Usage: npx tsx trigger.ts
 */
async function main() {
  const client = await TaskClient.create({
    listing: 'private',
    apiKey: process.env.BLOCKS_API_KEY!,
  });

  const session = await client.sendMessage({
    agentName: 'ai_copy_cleaner_h7p9',
    requestParts: [textPart(JSON.stringify({
      text: "Today, we're excited to share our cutting-edge platform that seamlessly empowers teams to unlock the power of smarter workflows. Furthermore, this enables users to streamline collaboration.",
    }), 'request')],
  });

  console.log('Task created:', session.taskId);

  session.onProgress((event: ProgressEvent) => {
    console.log('[progress]', event.message ?? event.progress ?? '');
  });

  const terminal = await session.waitForTerminal(60_000);
  console.log('[done]', terminal.state);

  const artifacts = session.listArtifacts();
  for (const ref of artifacts) {
    if (ref.kind === 'inline' && ref.data) {
      const bytes = decodeInlineArtifact(ref);
      console.log('[artifact]', new TextDecoder().decode(bytes));
    } else {
      const downloaded = await session.downloadArtifact(ref);
      console.log('[artifact]', new TextDecoder().decode(downloaded.data));
    }
  }

  await session.asyncClose();
  client.destroy();
}

main().catch(console.error);
