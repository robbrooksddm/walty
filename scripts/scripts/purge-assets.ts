/**********************************************************************
 * scripts/purge-assets.ts  –  delete Sanity assets tagged "temp-upload"
 * run with:  npm run purge:assets
 *********************************************************************/
import 'dotenv/config';
import { sanity } from '@/sanity/lib/client';

async function main() {
  console.log('🔍 finding temp assets…');

  /* 1 ▸ fetch up to 1000 image assets that carry the tag "temp-upload" */
  const assets: { _id: string | null }[] = await sanity.fetch(`
    *[_type == "sanity.imageAsset" && "temp-upload" in tags[]->name][0...1000]{
      _id
    }
  `);

  const ids = assets.map(a => a._id).filter((id): id is string => !!id);

  console.log('raw ids:', ids);   // ← debug line

  if (ids.length === 0) {
    console.log('✅ nothing to purge');
    return;
  }

  /* 2 ▸ delete them in a single transaction */
  console.log(`🗑 deleting ${ids.length} assets…`);
  const tx = sanity.transaction();
  ids.forEach(id => tx.delete(id));
  await tx.commit();

  console.log('✅ purge complete');
}

main().catch(err => {
  console.error('❌ error:', err);
  process.exit(1);
});