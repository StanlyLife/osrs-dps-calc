import { observer } from 'mobx-react-lite';
import { useStore } from '@/state';
import { DisplayEffect, getSpriteTile } from '@/app/components/player/demonicPactsLeague/SkillTreeNode';
import { dbrowDefinitions, LeaguesEffect } from '@/app/components/player/demonicPactsLeague/parse_skill_tree_elements';
import Image from 'next/image';
import { getBackingIcon } from '@/app/components/player/demonicPactsLeague/icons';

const DAMAGE_PACT_EFFECTS: LeaguesEffect[] = [
  'talent_percentage_melee_damage',
  'talent_percentage_ranged_damage',
  'talent_percentage_magic_damage',
];

const combineEffectValues = (values: (number | '[Constant: true]')[]) => values.reduce((acc, value) => {
  if (value === '[Constant: true]' || acc === '[Constant: true]') {
    return '[Constant: true]';
  }
  return acc + value;
}, 0);

const getDisplayName = (skillTreeNodeId: string, combinedValue: number | '[Constant: true]') => {
  const node = dbrowDefinitions[skillTreeNodeId];
  const { name } = node;
  // Scale the +10% accuracy text for damage pacts when multiple are selected
  if (DAMAGE_PACT_EFFECTS.includes(node.effect.name) && typeof combinedValue === 'number' && combinedValue > 1) {
    return name.replace('+10%', `+${combinedValue * 10}%`);
  }
  return name;
};

const CurrentEffects = observer(() => {
  const store = useStore();
  return (
    <div className="flex flex-col w-full">
      <h2 className="text-shadow-md font-serif font-bold px-4 py-2 bg-[#28221d] border-[#806f61]">
        Current Effects
      </h2>
      <div className="flex-1 text-xs max-h-72 overflow-y-scroll">
        {store.currentEffects.size === 0 ? (
          <div className="px-4 p-2">None selected</div>
        ) : (
          <ul>
            {Array.from(store.currentEffects.values()).map(
              ({ skillTreeNodeId, values }, ix) => {
                const combined = combineEffectValues(values);
                return (
                  <li
                    // eslint-disable-next-line react/no-array-index-key
                    key={ix}
                    className="effect-container p-2 bg-dark-300 border-b border-[#806f61] flex gap-2 items-center"
                  >
                    <div
                      className="bg-cover size-8 square min-size-12 aspect-square flex items-center justify-center"
                      style={{
                        backgroundImage: `url(${getBackingIcon(
                          true,
                          true,
                          dbrowDefinitions[skillTreeNodeId].node_size,
                        ).src})`,
                      }}
                    >
                      <Image
                        className="size-4/6 object-center object-contain aspect-square"
                        src={getSpriteTile(skillTreeNodeId, true)}
                        alt="Pact icon"
                      />
                    </div>
                    <DisplayEffect
                      name={getDisplayName(skillTreeNodeId, combined)}
                      effectValue={combined}
                    />
                  </li>
                );
              },
            )}
          </ul>
        )}
      </div>
    </div>
  );
});

export default CurrentEffects;
