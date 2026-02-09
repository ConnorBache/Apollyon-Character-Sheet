/*
 * Apollyon Character Sheet Logic (script.js)
 * -----------------------------------------
 * This file contains all client-side logic for the character sheet UI.
 * The code is intentionally verbose and documented for clarity.
 *
 * Responsibilities:
 *  - Build dynamic UI rows/sections
 *  - Provide live calculations (totals, End values)
 *  - Wire up Mote -> Ability dropdown population from a JSON map
 *
 * Author: Manratt Games helper
 */

(() => {
  "use strict";

  // =============================
  // Configuration & Data Models
  // =============================

  /** Core attribute labels in display order. */
  const CORE_ATTRS = ["Strength", "Agility", "Grit", "Spirit", "Speed"];

  /** Calculated attributes and whether they need an extra field (current values for Max HP, BP, Mana). */
  const CALC_ATTRS = [
    { key: "Max HP", extra: "HP" },
    { key: "DR" },
    { key: "AC" },
    { key: "BP", extra: "Current" },
    { key: "Speed" },
    { key: "Mana", extra: "Current" },
  ];

  /**
   * Abilities catalog, loaded from JSON file.
   * Structure: mote name -> list of abilities with name, desc, and details.
   */
  let abilitiesByMote = {
    "": [{"name": "", "desc": "", "details": ""}]
  };

  /**
   * Your abilities data embedded directly in the script to avoid CORS issues.
   * This is your JSON data converted to JavaScript format.
   */
  const abilitiesData = [
    {
      "mote": "Shrail",
      "name": "I Hit Back",
      "details": "When you take damage from an enemy, you may move a number of blocks equal to half your Strength and take a punch action.",
      "desc": "When hit, move half STR in blocks and punch."
    },
    {
      "mote": "Shrail",
      "name": "Vitality of Rage",
      "details": "Gain +3 Grit and +Strength Max HP.",
      "desc": "Gain +3 Grit and +Strength Max HP."
    },
    {
      "mote": "Shrail",
      "name": "Muscle of the Butcher",
      "details": "Gain +3 Strength and once per turn when you take damage, gain 1 Strength.",
      "desc": "+3 STR; once/turn when damaged, +1 STR."
    },
    {
      "mote": "Shrail",
      "name": "Unfeeling Berserker",
      "details": "Gain Strength max BP and 2x Strength HP.",
      "desc": "Gain Strength max BP and 2x Strength HP."
    },
    {
      "mote": "Shrail",
      "name": "Execute",
      "details": "[Boost 6] When you hit with a strike, you learn whether the strike's maximum possible damage roll is greater than the health of the enemy. If it is, kill them. Otherwise, regain 6 BP.",
      "desc": "6 BP: on hit, check if max damage could kill; if yes, enemy dies; if no, refund 6 BP."
    },
    {
      "mote": "Shrail",
      "name": "Rage at the Dying of the Light",
      "details": "[Boost 1+N] When you are reduced to 0 HP from damage which is not you, you may stay at one HP. N is the number of rounds other than this one you have used this boost.",
      "desc": "Cheat death to 1 HP (cost increases each round)."
    },
    {
      "mote": "Shrail",
      "name": "Unyielding Assault",
      "details": "[Boost 3] You may attack as a minor action.",
      "desc": "3 BP: attack as a minor action."
    },
    {
      "mote": "Shrail",
      "name": "Beat to Death",
      "details": "[Boost 1] Once per turn when taking the punch action, take another punch action.",
      "desc": "[Boost 1] Once per turn when taking the punch action, take another punch action."
    },
    {
      "mote": "Shrail",
      "name": "Masochism",
      "details": "Whenever you take damage, gain a number of boost points equal to the amount of damage you took divided by five, rounding up.",
      "desc": "Gain BP equal to damage ÷ 5 (round up) whenever hurt."
    },
    {
      "mote": "Shrail",
      "name": "Fist Fighter",
      "details": "When you attack, you may take a punch action as a movement action. In addition, your punches do Str damage instead of Str/2.",
      "desc": "Punch as movement; punches deal full STR damage."
    },
    {
      "mote": "Shrail",
      "name": "Fight Long",
      "details": "Gain an additional amount of HP equal to quadruple your Strength.",
      "desc": "Gain an additional amount of HP equal to quadruple your Strength."
    },
    {
      "mote": "Shrail",
      "name": "Fury Casting",
      "details": "Gain 10 Mana, a Soul Casting Token and 2 other Casting Tokens of your choice. Also, learn 3 spells. You may take this ability more than once.",
      "desc": "10 Mana; Soul + 2 Tokens; learn 3 spells."
    },
    {
      "mote": "Shrail",
      "name": "Fury Craft",
      "details": "Learn the following Enhancement: [Boost X] When you strike, increase the damage of the strike by 5X. You may not increase the damage by more than 10. If you are the creator of this item, you may not increase the damage by more than 20 instead.",
      "desc": "Enhancement: [Boost X] +5X strike damage (cap +10; +20 if creator)."
    },
    {
        "mote": "Pelian",
        "name": "Only In Death Will You Be Rid Of Me",
        "details": "When you are reduced to 0 HP, you may regain (Spirit)d12 health once per combat. Damage that would reduce you to below 0 HP is not dealt. This is not negatable.",
        "desc": "Once per combat, instead of dying, restore (Spirit)d12 HP."
    },
    {
        "mote": "Pelian",
        "name": "Mind Over Body",
        "details": "Gain +3 Grit and you may use the \u2018Cleanse\u2019 effect (found in the Official Spellbuilder) on yourself at the end of each of your turns.",
        "desc": "+3 Grit; auto-Cleanse yourself each turn."
    },
    {
        "mote": "Pelian",
        "name": "Impossible Ambition",
        "details": "Gain +3 Spirit and do an additional ten damage when you hit with an attack when your HP is less than half of your Max HP.",
        "desc": "+3 Spirit; below half HP, +10 damage on hits."
    },
    {
        "mote": "Pelian",
        "name": "I Will Myself Forward",
        "details": "Gain +3 Strength and you may Dash with Strength instead of Agility.",
        "desc": "Gain +3 Strength and you may Dash with Strength instead of Agility."
    },
    {
        "mote": "Pelian",
        "name": "You Have No Right",
        "details": "[Boost 2] Once per turn when an enemy would damage you, double your DR for the rest of the turn.",
        "desc": "[Boost 2] Once per turn when an enemy would damage you, double your DR for the rest of the turn."
    },
    {
        "mote": "Pelian",
        "name": "I Came For You",
        "details": "[Boost 3] {C} At the start of your turn, select an enemy. That enemy cannot apply cleansable debuffs to you, and takes 10 extra damage when you hit them with a strike. You may only mark one enemy this way at a time.",
        "desc": "3 BP: mark an enemy, prevent cleansable debuffs on you, deal +10 damage to them."
    },
    {
        "mote": "Pelian",
        "name": "Do Not Touch Them",
        "details": "Gain the following Reaction: [Protect: Trigger: An ally (not you) within a block of you is attacked. Effect: Redirect the attack to you, and it does half its regular damage (this reduction is applied after boosts but before DR).]",
        "desc": "Reaction: redirect attack from adjacent ally; you take half damage."
    },
    {
        "mote": "Pelian",
        "name": "Never Without a Fight",
        "details": "[Boost 3] When you are damaged, take a melee attack action against whomever damaged you.",
        "desc": "[Boost 3] When you are damaged, take a melee attack action against whomever damaged you."
    },
    {
        "mote": "Pelian",
        "name": "Relentless Pursuit",
        "details": "When an enemy within 5 blocks of you declares a Running or Dashing action, you may take a free movement action after their action resolves, and take a free punch action if you end that movement next to them.",
        "desc": "Free move after enemy runs/dashes within 5; if adjacent, also punch."
    },
    {
        "mote": "Pelian",
        "name": "Bulwark of Mind",
        "details": "Gain an additional amount of HP equal to quadruple your Spirit.",
        "desc": "Gain an additional amount of HP equal to quadruple your Spirit."
    },
    {
        "mote": "Pelian",
        "name": "Never Surrender",
        "details": "[Boost 3] When you are damaged, gain half Spirit DR for that damage. If the enemy ignores DR, they instead ignore half DR for that damage",
        "desc": "3 BP: gain half Spirit as DR vs that damage (even partly against ignore DR)."
    },
    {
        "mote": "Pelian",
        "name": "Zeal Casting",
      "details": "Gain 10 Mana, a Hollow Casting Token and 2 other Casting Tokens of your choice. Also, learn 3 spells. You may take this ability more than once.",
      "desc": "10 Mana; Hollow + 2 Tokens; learn 3 spells."
    },
    {
        "mote": "Pelian",
        "name": "Zeal Craft",
        "details": "Learn the following Enhancement: Your maximum HP is increased by 30 percent. If you are the creator of this item, then in addition you have [Boost 4] If your health is below half after taking damage you may regain HP equal to 1/4 of your maximum. Once this ability is used, you cannot use it again until the beginning of your next turn.",
        "desc": "Enhancement: +30% max HP; if creator, [Boost 4] below half HP after damage heal 1/4 max (1/turn)."
    },
    {
        "mote": "Isheilah",
        "name": "Last Minute Preparations",
        "details": "When you take the Preparing action, you gain three preparations instead of one.",
        "desc": "When you take the Preparing action, you gain three preparations instead of one."
      },
      {
        "mote": "Isheilah",
        "name": "Humor in Suffering",
        "details": "Gain +3 Spirit and when you take 10 or more damage from an enemy in one instance, you regain 1 BP.",
        "desc": "+3 Spirit; regain 1 BP if you take \u226510 damage at once."
      },
      {
        "mote": "Isheilah",
        "name": "Are You Sure About That?",
        "details": "[4+X] When you take the Block or Roll reaction. If you do, redirect the strike to someone within one block of you. If X is greater than 1, you may redirect an enemy into hitting themselves.",
        "desc": "[4+X] When you take the Block or Roll reaction. If you do, redirect the strike to someone within one block of you. If X is greater than 1, you may redirect an enemy into hitting themselves."
      },
      {
        "mote": "Isheilah",
        "name": "Dodge",
        "details": "[React] When an enemy lands a glancing blow against you, the strike is negated.",
        "desc": "Reaction: nullify glancing blow damage."
      },
      {
        "mote": "Isheilah",
        "name": "Missed Me",
        "details": "[React] When an enemy hits you with a strike, they glance instead.",
        "desc": "Reaction: turn a hit into a glance."
      },
      {
        "mote": "Isheilah",
        "name": "Tools of the Trade",
        "details": "You may drink any number of potions over the course of an encounter and may drink a potion at the end of your turn. In addition, you gain one potion of your choice at the start of combat.",
        "desc": "Drink any # of potions/encounter; drink at end of turn; start combat with 1 potion."
      },
      {
        "mote": "Isheilah",
        "name": "Spellslinger",
        "details": "[Boost 4] When you use a normal reaction, instead of using that reaction you may take a cast action.",
        "desc": "[Boost 4] When you use a normal reaction, instead of using that reaction you may take a cast action."
      },
      {
        "mote": "Isheilah",
        "name": "Make Fizzle",
        "details": "[React] Once per turn when an enemy boosts, the enemy must pay (Spirit) more BP, or the boost is negated.",
        "desc": "Reaction: once/turn when enemy boosts, they pay +Spirit BP or the boost is negated."
      },
      {
        "mote": "Isheilah",
        "name": "Make Slippery",
        "details": "[Boost 2] When an enemy within 10 blocks begins moving, you may make their movement end.",
        "desc": "[Boost 2] When an enemy within 10 blocks begins moving, you may make their movement end."
      },
      {
        "mote": "Isheilah",
        "name": "Hanged",
        "details": "[Boost X] When you take damage, reduce it by 4X. In addition, your flight increases by 1.",
        "desc": "[Boost X] When you take damage, reduce it by 4X; +1 Flight."
      },
      {
        "mote": "Isheilah",
        "name": "Quick Hands",
        "details": "[Boost 1] Once per turn when you are damaged, you may take a preparing action.",
        "desc": "[Boost 1] Once per turn when you are damaged, you may take a preparing action."
      },
      {
        "mote": "Isheilah",
        "name": "Guile Casting",
      "details": "Gain 10 Mana, a Pact Casting Token and 2 other Casting Tokens of your choice. Also, learn 3 spells. You may take this ability more than once.",
      "desc": "10 Mana; Pact + 2 Tokens; learn 3 spells."
      },
      {
        "mote": "Isheilah",
        "name": "Guile Craft",
        "details": "You may always act as if the attack action triggers Cut Down, even with melee weapons. This reaction triggers after the attack resolves. If the creator of this item is wielding it, Whenever you make a Cut Down reaction, it does double damage and the damage it deals cannot be reduced. ",
        "desc": "Enhancement: attacks always trigger Cut Down; if creator wielding, Cut Down is double irreducible damage."
      },
      {
        "mote": "Numo",
        "name": "Imbue Hallucination",
        "details": "When you use a boost, you gain a Hallucination. If an enemy would target you, you may expend X hallucinations and they must target someone else or the targeting is negated unless they spend 2X BP.",
        "desc": "Boost to get hallucinations. Spend them to make enemies pay BP when they target you."
      },
      {
        "mote": "Numo",
        "name": "Trapped Thought Process",
        "details": "After taking a cast action, Select an action (such as \u201cAttack\u201d) and an enemy. {C} That enemy takes an amount of damage equal to your spirit every time they take that action until the end of combat.",
        "desc": "On Cast: tag enemy+action; they take Spirit damage whenever they use it (until combat ends)."
      },
      {
        "mote": "Numo",
        "name": "Obsession",
        "details": "Gain +3 Spirit, and on your turn, you do 5 more damage when you hit the enemy who started the turn closest to you with an attack.",
        "desc": "+3 Spirit; +5 damage vs enemy who began turn closest to you."
      },
      {
        "mote": "Numo",
        "name": "Remember",
        "details": "[Boost 2] After a boost is used. That boost is now your 'Remembered Boost' and you can use it as if you have it. You may only have one 'Remembered Boost' at a time.",
        "desc": "[Boost 2] Remember a boost."
      },
      {
        "mote": "Numo",
        "name": "Implant Thought",
        "details": "[Boost 5] At the start of your turn, make an enemy take a major action that you control.",
        "desc": "[Boost 5] At the start of your turn, make an enemy take a major action that you control."
      },
      {
        "mote": "Numo",
        "name": "Distract",
        "details": "[Boost 2] {C} Before you take a minor action, a target enemy cannot declare you as a target for any action until the end of their next turn.",
        "desc": "[Boost 2] {C} Before you take a minor action, a target enemy cannot declare you as a target for any action until the end of their next turn."
      },
      {
        "mote": "Numo",
        "name": "Visions",
        "details": "Gain +(Spirit) to hit all enemies that you can see.",
        "desc": "Gain +(Spirit) to hit all enemies that you can see."
      },
      {
        "mote": "Numo",
        "name": "Echo of the Past",
        "details": "[Boost 2] Once per round after casting a spell, you may cast it again.",
        "desc": "[Boost 2] Once per round after casting a spell, you may cast it again."
      },
      {
        "mote": "Numo",
        "name": "Mind Read",
        "details": "[Boost 1] Before you take a minor action, you may select a target within 10 blocks. You learn their base character sheet and may deal Spirit/2 damage to them.",
        "desc": "1 BP minor: view target\u2019s base sheet and deal Spirit/2 damage."
      },
      {
        "mote": "Numo",
        "name": "Mental Assault",
        "details": "When you use the punch action, you may use your Spirit instead of your Strength. In addition, when you punch you do 3 extra damage.",
        "desc": "Punch with Spirit instead of STR; +3 damage on punches."
      },
      {
        "mote": "Numo",
        "name": "Revert",
        "details": "Once per combat when you would die you instead have half your maximum HP at the end of the action. This cannot be negated.",
        "desc": "Once/combat: instead of dying, end action at half HP."
      },
      {
        "mote": "Numo",
        "name": "Memory Casting",
      "details": "Gain 10 Mana, an Arcane Casting Token and 2 other Casting Tokens of your choice. Also, learn 3 spells. You may take this ability more than once.",
      "desc": "10 Mana; Arcane + 2 Tokens; learn 3 spells."
      },
      {
        "mote": "Numo",
        "name": "Memory Craft",
        "details": "Learn the following Enhancement: Once per combat, at the start of your turn regain a number of boost points equal to your Spirit. If you are the creator, instead regain all your boost points.",
        "desc": "Enhancement: 1/combat start of turn regain Spirit BP; if creator, regain all BP."
      },
      {
        "mote": "Etill",
        "name": "Float Away",
        "details": "[Boost 1] When you take non-self damage, you may take a movement action. Your Flight increases by 1.",
        "desc": "[Boost 1] When you take non-self damage, move; +1 Flight."
      },
      {
        "mote": "Etill",
        "name": "Flowing Mind",
        "details": "Gain an additional amount of Max BP equal to your Agility and additional HP equal to double your Agility.",
        "desc": "Gain an additional amount of Max BP equal to your Agility and additional HP equal to double your Agility."
      },
      {
        "mote": "Etill",
        "name": "Ease of Mind",
        "details": "Gain +3 Spirit and gain a free preparation at the start of each round.",
        "desc": "Gain +3 Spirit and gain a free preparation at the start of each round."
      },
      {
        "mote": "Etill",
        "name": "Phase Through",
        "details": "You may move through enemies and obstacles as though they are not there, and enemies cannot react or boost in response to your movement. {C} Once per turn when you move through an enemy, they lose Spirit/2 Agility.",
        "desc": "Move through enemies/obstacles; immune to reactions/boosts from movement. Take away Spi/2 of enemy Agi when you move through them."
      },
      {
        "mote": "Etill",
        "name": "With the Wind",
        "details": "Gain the following Boost: [Ride: You may spend 2 boost points when you take a movement action and take an additional movement action at the conclusion of that movement action.]",
        "desc": "2 BP: chain an extra movement after moving."
      },
      {
        "mote": "Etill",
        "name": "Half Here",
        "details": "Halve damage from attacks that glanced against you.",
        "desc": "Halve damage from attacks that glanced against you."
      },
      {
        "mote": "Etill",
        "name": "Drown",
        "details": "[Boost 3] Drown: When you do damage to an enemy, do an additional amount of damage equal to your Spirit.",
        "desc": "[Boost 3] Drown: When you do damage to an enemy, do an additional amount of damage equal to your Spirit."
      },
      {
        "mote": "Etill",
        "name": "Rushing Torrent",
        "details": "[Boost 5] After ending a movement action next to an enemy, you may take a major action once per enemy per round.",
        "desc": "5 BP: end movement adjacent \u2192 gain major action (once per enemy/round)."
      },
      {
        "mote": "Etill",
        "name": "Riptide",
        "details": "[Boost 3] After taking a major action targeting an enemy, reduce their Agility by your Spirit until the end of their next turn.",
        "desc": "[Boost 3] After taking a major action targeting an enemy, reduce their Agility by your Spirit until the end of their next turn."
      },
      {
        "mote": "Etill",
        "name": "The Tide Comes In",
        "details": "Gain +3 Agility. In addition, at the start of each of your turns, increase your agility by 1.",
        "desc": "+3 AGI; AGI increases +1 each turn."
      },
      {
        "mote": "Etill",
        "name": "Size of the Ocean",
        "details": "Gain an additional amount of HP equal to quadruple your Agility.",
        "desc": "Gain an additional amount of HP equal to quadruple your Agility."
      },
      {
        "mote": "Etill",
        "name": "Flow Casting",
      "details": "Gain 10 Mana, an Elemental Casting Token and 2 other Casting Tokens of your choice. Also, learn 3 spells. You may take this ability more than once.",
      "desc": "10 Mana; Elemental + 2 Tokens; learn 3 spells."
      },
      {
        "mote": "Etill",
        "name": "Flow Craft",
        "details": "You may exchange 2 minor actions for a major action, and vice versa. You may also substitute 2 movement actions for a minor action, or 1 minor action for a movement action. This substitution may be done before or after any of your actions. If you are the creator, you gain a movement action at the start of each of your turns.",
        "desc": "Enhancement: trade action types; if creator, +1 move at start of each turn."
      },
      {
        "mote": "Ursa",
        "name": "Oblivious",
        "details": "[Boost 2] At the beginning of your turn, enemies may not declare reactions or boosts in response to your actions until the end of your turn. Reactions and Boosts cannot be declared against this boost.",
        "desc": "2 BP at start of turn: enemies cannot react/boost against you this turn."
      },
      {
        "mote": "Ursa",
        "name": "Living in the Back of the Brain",
        "details": "Gain +3 Spirit and you may reduce damage from Cast actions by 5.",
        "desc": "Gain +3 Spirit and you may reduce damage from Cast actions by 5."
      },
      {
        "mote": "Ursa",
        "name": "Don\u2019t Care",
        "details": "Gain +4 Damage Resistance and you may reduce damage from sources which do not target you by 5.",
        "desc": "Gain +4 Damage Resistance and you may reduce damage from sources which do not target you by 5."
      },
      {
        "mote": "Ursa",
        "name": "Waking Nightmare",
        "details": "You have 2 nightmares. When you end your turn and did not boost on that turn, you gain a nightmare. When you take damage from an enemy, you may spend a nightmare and instead take no damage.",
        "desc": "Gain a nightmare by not boosting on your turn, spend a nightmare to reduce damage to 0."
      },
      {
        "mote": "Ursa",
        "name": "Fear The Unknown",
        "details": "Until an enemy successfully hits you in combat, gain 6 Agility and 4 DR. You lose this Agility and DR when you are hit.",
        "desc": "Start of combat: +6 AGI & +4 DR until first hit."
      },
      {
        "mote": "Ursa",
        "name": "Acute Fascination",
        "details": "[Boost 2] {C} At the end of your turn, select an enemy. Once per turn, when you would glance against that enemy with a strike, you hit instead. If you land a critical hit against that enemy, you may add your Strength to the damage roll. You may only fixate on one enemy this way at a time.",
        "desc": "2 BP end of turn: fixate on an enemy; glances hit, crits add STR."
      },
      {
        "mote": "Ursa",
        "name": "Sudden Sleep",
        "details": "[Boost 6] As a major action, your HP is restored to its maximum value, and you regain half your maximum Mana. This ends your turn.",
        "desc": "[Boost 6] As a major action, regain max HP and half max Mana. This ends your turn."
      },
      {
        "mote": "Ursa",
        "name": "Comatose",
        "details": "Once per combat when you would die, you instead have Max HP and may lose all your BP. This cannot be negated. You cannot boost until you next take damage.",
        "desc": "On die: Regain max HP and no boosting until you take damage."
      },
      {
        "mote": "Ursa",
        "name": "Sleep Walk",
        "details": "If you have no boost points at the start of your turn, you may take 2 movement actions instead of 1 and 2 major actions instead of 1.",
        "desc": "At 0 BP at start: double moves and majors this turn."
      },
      {
        "mote": "Ursa",
        "name": "Restful Sleep",
        "details": " [Boost 5] As a minor action, allies within 10 blocks heal an amount equal to your Spirit.",
        "desc": " [Boost 5] As a minor action, allies within 10 blocks heal an amount equal to your Spirit."
      },
      {
        "mote": "Ursa",
        "name": "Dream of Time Gone By",
        "details": "Learn 2 powers: [Boost 4] At the start or end of your turn, mark your current HP and position.\n This is your “Set State.” If you are cleansed, you lose your Set State.\n[Boost 4] At the start or end of your turn, return to your Set State and you no longer have a Set State.\nYou may not use both powers in the same turn.",
        "desc": "4 BP: set a checkpoint (HP, position); 4 BP later to return to it."
      },
      {
        "mote": "Ursa",
        "name": "Dream Casting",
      "details": "Gain 10 Mana, a Phantasm Casting Token and 2 other Casting Tokens of your choice. Also, learn 3 spells. You may take this ability more than once.",
      "desc": "10 Mana; Phantasm + 2 Tokens; learn 3 spells."
      },
      {
        "mote": "Ursa",
        "name": "Dream Craft",
        "details": "Learn the following Enhancement: Gain 10 boost points. If you are the creator, instead gain 5 Spirit and increase your Flight by 1.",
        "desc": "Enhancement: gain 10 BP; if creator, instead gain 5 Spirit and +1 Flight."
      },
      {
        "mote": "Lichor",
        "name": "Black Blood",
        "details": "[Boost 3] After you take damage from an enemy within melee range, deal an amount of damage equal to Grit to that enemy.",
        "desc": "[Boost 3] After you take damage from an enemy within melee range, deal an amount of damage equal to Grit to that enemy."
      },
      {
        "mote": "Lichor",
        "name": "Manually Coagulate",
        "details": "Gain +3 Grit and when you take a minor action, you may take X irreducible damage and heal another ally within 5 by X.",
        "desc": "+3 Grit; can self-damage on minor to heal ally for same amount."
      },
      {
        "mote": "Lichor",
        "name": "Hardened Blood",
        "details": "Gain +4 Damage Resistance and increase damage you deal from attacks you hit with by half your Damage Resistance.",
        "desc": "Gain +4 Damage Resistance and increase damage you deal from attacks you hit with by half your Damage Resistance."
      },
      {
        "mote": "Lichor",
        "name": "Gush",
        "details": "During the start of your turn, you may take any amount of damage which is not affected by damage resistance. For every four damage you take, you may regain a boost point.",
        "desc": "At start of turn, self-damage (ignores DR); regain 1 BP per 4 damage taken."
      },
      {
        "mote": "Lichor",
        "name": "Blood Weapon",
        "details": "[Boost 2] Replace any one stat with Grit for a die roll.",
        "desc": "[Boost 2] Replace any one stat with Grit for a die roll."
      },
      {
        "mote": "Lichor",
        "name": "The Number of Blood",
        "details": "[Boost 5] When doing damage with a strike that hit, do 5d6 extra damage. If the enemy is reduced to 0 HP by the strike, regain 5 boost points and 5d6 health.",
        "desc": "5 BP: +5d6 damage; if kill, regain 5 BP and 5d6 HP."
      },
      {
        "mote": "Lichor",
        "name": "Hemorrhage",
        "details": "[Boost 2] {C} When you hit with a strike, the target suffers (Your Grit) damage at the start of their turn for the rest of combat. This does not stack with itself.",
        "desc": "2 BP: inflict bleed = Grit each turn (non-stacking)."
      },
      {
        "mote": "Lichor",
        "name": "Stop Bleeding",
        "details": "When given a cleansable effect, you may decide to not be given it instead.",
        "desc": "When given a cleansable effect, you may decide to not be given it instead."
      },
      {
        "mote": "Lichor",
        "name": "Made of Liquid",
        "details": "Gain Grit max BP and 2x Grit HP.",
        "desc": "Gain Grit max BP and 2x Grit HP."
      },
      {
        "mote": "Lichor",
        "name": "Overflowing",
        "details": "You begin combat with 5 Blood. When you would reach 0 HP from enemy damage, you may instead spend a Blood to stay at 1 HP.",
        "desc": "Start with 5 blood. You can spend 1 to avoid dying."
      },
      {
        "mote": "Lichor",
        "name": "Absorb Blood",
        "details": "[Boost 6] At the start of your turn, begin logging how much damage you do to enemies this turn. At the end of your turn, regain HP equal to 1/4 of the damage dealt.",
        "desc": "6 BP at start: heal 25% of damage dealt this turn."
      },
      {
        "mote": "Lichor",
        "name": "Blood Casting",
      "details": "Gain 10 Mana, a Blood Casting Token and 2 other Casting Tokens of your choice. Also, learn 3 spells. You may take this ability more than once.",
      "desc": "10 Mana; Blood + 2 Tokens; learn 3 spells."
      },
      {
        "mote": "Lichor",
        "name": "Blood Craft",
        "details": "Learn the following Enhancement: As a minor action, heal equal to twice your DR. If you are the creator, instead heal 4 times your DR.",
        "desc": "Enhancement: minor heal 2\u00d7DR (4\u00d7DR if creator)."
      },
      {
        "mote": "Dawel",
        "name": "Step Through Shadows",
        "details": "[Boost 1+X] At the beginning of your turn you may appear anywhere that enemies cannot see within the combat zone. If X is 3 or higher, you may appear anywhere.",
        "desc": "1 BP: teleport to unseen spot; 4 BP: teleport anywhere."
      },
      {
        "mote": "Dawel",
        "name": "Wisdom",
        "details": "Gain +3 Spirit and do an additional damage with your attacks for each ally who took their turn before you this round.",
        "desc": "+3 Spirit; +1 damage per ally who acted before you this round."
      },
      {
        "mote": "Dawel",
        "name": "Unspeak",
        "details": "[Boost N] When an enemy declares a boost where they spent N boost points, negate the boost. Resources are not spent, but they may not declare the same boost on this trigger again. After a boost fully resolves, it cannot be unspoken.",
        "desc": "X BP: cancel an enemy boost as declared (they regain BP)."
      },
      {
        "mote": "Dawel",
        "name": "Silent Strike",
        "details": "When you land a critical hit with a strike, do an additional amount of damage equal to double one of your damage attributes for that strike.",
        "desc": "On crit, deal +2\u00d7 one damage attribute."
      },
      {
        "mote": "Dawel",
        "name": "Unheard, Unseen",
        "details": "[Boost 2] When an enemy hits you with a strike, they glance.",
        "desc": "[Boost 2] When an enemy hits you with a strike, they glance."
      },
      {
        "mote": "Dawel",
        "name": "Without a Heartbeat",
        "details": "When you would die, instead of dying you gain 2 ‘heartbeats.’ You lose a heartbeat at the end of each of your turns. When you lose your last heartbeat, you die.",
        "desc": "On death: gain 2 heartbeats; lose 1/end of turn; die when heartbeats run out."
      },
      {
        "mote": "Dawel",
        "name": "Reverse Entropy",
        "details": "Enemies within 3 blocks of you cannot increase their attributes or calculated attributes.",
        "desc": "Enemies within 3 blocks of you cannot increase their attributes or calculated attributes."
      },
      {
        "mote": "Dawel",
        "name": "Noise Void",
        "details": "[Boost X]{C} Enemies within 8 blocks of you must spend X additional boost points to boost until the start of your next turn.",
        "desc": "X BP start of turn: enemies within 8 pay +X BP for boosts."
      },
      {
        "mote": "Dawel",
        "name": "Shadow in the Dark",
        "details": "Enemies cannot declare reactions on your turn.",
        "desc": "Enemies cannot declare reactions on your turn."
      },
      {
        "mote": "Dawel",
        "name": "Draw Volume",
        "details": "Every time another character boosts, add 1 to your Volume pool. You may spend Volume instead of BP whenever you would spend BP. You may only gain 3 Volume per turn.",
        "desc": "Gain Volume when others boost (max 3/turn); spend as BP."
      },
      {
        "mote": "Dawel",
        "name": "Not There",
        "details": "[Boost 2] When you are affected by an ability, casts, boost, reaction or attack which did not target you, you are unaffected. This cannot be used against effects caused by abilities, casts, boosts, reactions and attacks which did target you.",
        "desc": "[Boost 2] When you are affected by an ability, casts, boost, reaction or attack which did not target you, you are unaffected. This cannot be used against effects caused by abilities, casts, boosts, reactions and attacks which did target you."
      },
      {
        "mote": "Dawel",
        "name": "Silence Casting",
      "details": "Gain 10 Mana, a Shadow Casting Token and 2 other Casting Tokens of your choice. Also, learn 3 spells. You may take this ability more than once.",
      "desc": "10 Mana; Shadow + 2 Tokens; learn 3 spells."
      },
      {
        "mote": "Dawel",
        "name": "Silence Craft",
        "details": "Learn the following Enhancement:  When someone glances against you, regain 3 boost points. If you are the creator, regain an additional 3 boost points when someone glances against you.",
        "desc": "Enhancement: when someone glances vs you, regain 3 BP (+3 more if creator)."
      },
      {
        "mote": "Grisha",
        "name": "You\u2019re Next",
        "details": "{C} When you reduce an enemy to 0 HP, choose another enemy. That enemy suffers a Mind Break until the end of combat, as well as -2 to Spirit and Grit. Then take an additional major action.",
        "desc": "On kill: another enemy suffers Mind Break, -2 Spirit/Grit, and you gain a major action."
      },
      {
        "mote": "Grisha",
        "name": "Death, Swift",
        "details": "Gain +3 Agility and you may take a movement action whenever you kill an enemy.",
        "desc": "Gain +3 Agility and you may take a movement action whenever you kill an enemy."
      },
      {
        "mote": "Grisha",
        "name": "Doom Desire",
        "details": "Gain +3 Spirit and you may attack an adjacent enemy when you are killed.",
        "desc": "Gain +3 Spirit and you may attack an adjacent enemy when you are killed."
      },
      {
        "mote": "Grisha",
        "name": "Uncast",
        "details": "When an enemy spends mana, you cannot take damage for the rest of the turn.",
        "desc": "When an enemy spends mana, you cannot take damage for the rest of the turn."
      },
      {
        "mote": "Grisha",
        "name": "Return Fire",
        "details": "[Boost 4] Hex Duel: After an enemy uses a cast action or spends boost points, immediately cast a spell or make a strike targeting them.",
        "desc": "4 BP: respond instantly with spell or attack when enemy casts/spends BP."
      },
      {
        "mote": "Grisha",
        "name": "Disintegrate",
        "details": "{C} Lower one of an enemy\u2019s attributes or movement speed by 2 when you hit them until the end of combat (If enemies lose grit, they lose max HP before they take damage).",
        "desc": "On hit: reduce attribute or speed by 2 until end of combat."
      },
      {
        "mote": "Grisha",
        "name": "Boundless Hunger",
        "details": "When you regain X BP, you gain X Max BP instead.",
        "desc": "When you regain X BP, you gain X Max BP instead."
      },
      {
        "mote": "Grisha",
        "name": "Entropy",
        "details": "Enemies that start their turn within 6 blocks of you take damage equal to your Spirit at the start of their turn, ignoring DR.",
        "desc": "Enemies that start their turn within 6 blocks of you take Spirit damage, ignoring DR."
      },
      {
        "mote": "Grisha",
        "name": "Devour Metaphysical",
        "details": "[Boost 4] When you hit an enemy with a strike and deal damage, you gain the knowledge of all of their boosts and abilities. You gain one of them for the rest of combat.",
        "desc": "4 BP: on hit, learn all enemy boosts/abilities; copy one for rest of combat."
      },
      {
        "mote": "Grisha",
        "name": "It Doesn't Come Back",
        "details": "[Boost 4] When you hit an enemy with a strike and deal damage, you gain the knowledge of all of their boosts and abilities. Select an ability or boost and they lose it for the rest of combat.",
        "desc": "4 BP: on hit, steal an ability/boost from enemy; they lose it."
      },
      {
        "mote": "Grisha",
        "name": "Swallow",
        "details": "Your size is 1. Every time an enemy boosts, gain a morsel. At the start of your turn, remove up to size morsels and increase your size by the number of morsels removed. You have additional HP equal to 10 times your size.",
        "desc": "Size starts 1; gain a morsel when enemies boost; start of turn eat up to size morsels to grow; bonus HP = 10\u00d7size."
      },
      {
        "mote": "Grisha",
        "name": "Ruin Casting",
      "details": "Gain 10 Mana, a Void Casting Token and 2 other Casting Tokens of your choice. Also, learn 3 spells. You may take this ability more than once.",
      "desc": "10 Mana; Void + 2 Tokens; learn 3 spells."
      },
      {
        "mote": "Grisha",
        "name": "Ruin Craft",
        "details": "Learn the following Enhancement: When you hit enemies, you may ignore their DR. If you are the creator, you may reduce the target’s Grit by 2 when you hit with a strike.",
        "desc": "Enhancement: on hit you may ignore target DR; if creator, strike hits also -2 Grit."
      },
      {
        "mote": "Anavani",
        "name": "I Shine",
        "details": "[Boost X]{C} At the start of your turn, all enemies within X blocks have -X to hit with strikes until the start of your next turn.",
        "desc": "X BP start: enemies within X blocks get \u2013X to hit until next turn."
      },
      {
        "mote": "Anavani",
        "name": "Commandment",
        "details": "Gain +3 Strength and when you hit an enemy with an attack, you may move them 1 block.",
        "desc": "Gain +3 Strength and when you hit an enemy with an attack, you may move them 1 block."
      },
      {
        "mote": "Anavani",
        "name": "Not A Chance",
        "details": "Gain +3 Spirit and once per round when you would be moved by an enemy, you are not.",
        "desc": "Gain +3 Spirit and once per round when you would be moved by an enemy, you are not."
      },
      {
        "mote": "Anavani",
        "name": "Master of All",
        "details": "Gain 4x (Your Second Lowest) Stat Max BP, and 6x (Your Second Lowest) HP.",
        "desc": "Extra Max BP = 4\u00d7 second-lowest stat; extra HP = 6\u00d7 second-lowest stat."
      },
      {
        "mote": "Anavani",
        "name": "Build Up",
        "details": "Gain 1 Grit, Strength, Agility and Spirit. In addition, once per round when you hit, gain a +1 to an attribute of your choice for the rest of the combat.",
        "desc": "+1 to all stats; once/round on hit, +1 to any attribute (permanent for combat)."
      },
      {
        "mote": "Anavani",
        "name": "Star Power",
        "details": "[Boost 1+X] At the end of your turn, gain a movement or minor action. If X is 2, gain a major action instead. This can only be done once per round.",
        "desc": "1 BP: +move/minor at end of turn; 3 BP: +major; once/round."
      },
      {
        "mote": "Anavani",
        "name": "Glow",
        "details": "As a minor action, you may regain (Spirit/2) boost points, rounding up.",
        "desc": "As a minor action, you may regain (Spirit/2) boost points, rounding up."
      },
      {
        "mote": "Anavani",
        "name": "Light It Up",
        "details": "Allies within 6 blocks of you (including yourself) gain +(Your Second Lowest Attribute) to damage from attacks.",
        "desc": "Allies within 6 add your second-lowest attribute to attack damage."
      },
      {
        "mote": "Anavani",
        "name": "Nova",
        "details": "[Boost 4] When you hit an enemy with a strike, do an additional amount of damage equal to Strength+Spirit.",
        "desc": "[Boost 4] When you hit an enemy with a strike, do an additional amount of damage equal to Strength+Spirit."
      },
      {
        "mote": "Anavani",
        "name": "Ascend",
        "details": "Before you take a minor action, you may appear anywhere within 5 blocks of your current location, and change your Height by up to 1, to a maximum of your Supported Height+Flight.",
        "desc": "Before minor: teleport within 5; change Height by up to 1 (max Supported Height+Flight)."
      },
      {
        "mote": "Anavani",
        "name": "Too High",
        "details": "[Boost 4] When you are hit or glanced by a melee strike, you may take a move action after the strike resolves which cannot be reacted to. If the strike hit, it instead glances. Increase your Flight by 1.",
        "desc": "4 BP on melee hit: make it glance; free move after (unreactable)."
      },
      {
        "mote": "Anavani",
        "name": "Ascendance Casting",
      "details": "Gain 10 Mana, an Astral Casting Token and 2 other Casting Tokens of your choice. Also, learn 3 spells. You may take this ability more than once.",
      "desc": "10 Mana; Astral + 2 Tokens; learn 3 spells."
      },
      {
        "mote": "Anavani",
        "name": "Ascendance Craft",
        "details": "Learn the following Enhancement: Hostile creatures within 15 blocks move at 1/2 speed. Effect: Hostile creatures within 15 blocks move at 1/2 speed. If you are the creator, enemies within 6 blocks also have their agility halved. This rounds up, and has no effect on creatures with Agility less than 2..",
        "desc": "Enhancement: hostiles within 15 move at half speed; if creator, enemies within 6 also have Agility halved."
      },
      {
        "mote": "Kative",
        "name": "Divine Craftsman",
        "details": "When you craft an item, instead of having only one Add-On, you may have 4. You may select any Add-Ons, but must select three to be \u201cExtra Add-Ons\u201d. When someone other than you is wielding this item, they do not benefit from Extra Add-Ons. You may only benefit from 3 of these Extra Add-Ons per combat. Each Add-On must be different, but they stack with non-Extra Add-Ons.",
        "desc": "Craft items with up to 4 Add-Ons; only you benefit from extras (max 3/combat)."
      },
      {
        "mote": "Kative",
        "name": "Weapon Improvement",
        "details": "At the beginning of each combat, you may give all allies +Spirit/4 to hit or to damage from attacks, which lasts for the entire combat.",
        "desc": "At combat start, buff allies with +Spirit/4 to hit or damage."
      },
      {
        "mote": "Kative",
        "name": "Soul Stone",
        "details": "You have 10 \u2018Stone BP.\u2019 You may spend Stone BP instead of BP whenever you would spend BP. Your Stone BP is set to 10 at the start of each of your turns.",
        "desc": "10 Stone BP each turn; can spend instead of BP."
      },
      {
        "mote": "Kative",
        "name": "Bottle Spell",
        "details": "[Boost N] After you take the cast action with a spell,  gain the spell as a potion that you can use whenever you would normally use a potion. You do not spend mana to consume this potion. The potion becomes permanently inert at the end of combat. You may use this potion even if you have already drank 2 potions in this combat. N is (the spell’s mana cost)/3.",
        "desc": "Spend (mana cost)/3 BP: store cast spell as potion usable later in combat."
      },
      {
        "mote": "Kative",
        "name": "Tinker",
        "details": "[Boost 4X] At the start of your turn, you and each adjacent ally's weapon does Xd6 additional weapon damage to a maximum of 10d6. This may only improve each ally once. This affects only one weapon they are using.",
        "desc": "[Boost 4X] Start of turn: you + adjacent allies gain +Xd6 weapon damage (cap 10d6); each ally once."
      },
      {
        "mote": "Kative",
        "name": "Perfectionist",
        "details": "On crit, double the damage dice.",
        "desc": "On crit, double the damage dice."
      },
      {
        "mote": "Kative",
        "name": "Appropriate",
        "details": "When using an item enhanced by a Mote Craft ability, you may treat yourself as the creator. You may only use this on one item at a time.",
        "desc": "Use someone else\u2019s crafted item as if you made it (1 item at a time)."
      },
      {
        "mote": "Kative",
        "name": "Mini-Me",
        "details": "Create a level 1 character with the same motes and no racial bonuses. At the start of combat or as a Major action on your turn, you may turn an enhanced item you have equipped into that character. They are summoned in adjacency and act on your turn, and have all of the benefits of that enhanced item. You regain the item at the end of combat. You may only create one mini-me per combat.",
        "desc": "Transform enhanced item into lvl 1 copy of you for combat; 1/combat."
      },
      {
        "mote": "Kative",
        "name": "Clay Army",
        "details": "[Boost 4] Before any action, you may place a Clay Golem which has quadruple Spirit HP in adjacency which cannot move and cannot be moved through. When an enemy takes an action next to one or more clay golems, they take Spirit damage. For the purposes of targeting, it is an allied creature.",
        "desc": "4 BP before action: summon a golem that does Spirit damage when adjacent enemies take actions."
      },
      {
        "mote": "Kative",
        "name": "Adaptive Armor",
        "details": "After you take damage from an enemy, gain 1 DR.",
        "desc": "After you take damage from an enemy, gain 1 DR."
      },
      {
        "mote": "Kative",
        "name": "Artifice Casting",
      "details": "Gain 10 Mana, a Rune Casting Token and 2 other Casting Tokens of your choice. Also, learn 3 spells. You may take this ability more than once.",
      "desc": "10 Mana; Rune + 2 Tokens; learn 3 spells."
      },
      {
        "mote": "Kative",
        "name": "Cogworks",
        "details": "[Boost X] At the start of your turn, select an option from the following table with a ‘Boost Points’ characteristic of X or less. \nBoost Points\nName\nOutcome\n1\nPortable Wall\nCreate a 1 block long by 4 blocks wide wall that cannot be seen through or moved over, with at least one block of that wall being within 8 blocks. This has 4xSpirit HP.\n2\nMurder Wall\nCreate a 1 block long by 4 blocks wide wall that can be seen through by allies only (they can also direct attacks through the wall), with at least one block of that wall being within 8 blocks. This has 3xSpirit HP.\n2\nBlast Rock\nDestroy an obstacle that was placed in this combat.\n2\nConfusion Gas\nSelect an unoccupied block within 8 blocks. It cannot be moved through and no one adjacent to that block can take the attack action.",
        "desc": "Spend X BP: deploy a gizmo (wall, blast, or gas) depending on choice."
      },
      {
        "mote": "Kative",
        "name": "Artifice Craft",
        "details": "Learn the following Enhancement: When creating this item, you may add any other Mote Craft enhancement to this item, without the text which empowers the creator of the item. If you are the creator,  you may add a second Mote Craft enhancement in the same way as the first without counting against maximum enhancements on the item or taking additional downtime.",
        "desc": "Enhancement: add another Mote Craft enhancement (no creator text); if creator, add a second similarly."
      },
      {
        "mote": "Morae",
        "name": "Turning The Wheel",
        "details": "[Boost 4] Sever the Thread: When an enemy declares a strike against you. The strike is nullified.",
        "desc": "[Boost 4] Sever the Thread: When an enemy declares a strike against you. The strike is nullified."
      },
      {
        "mote": "Morae",
        "name": "Unyielding",
        "details": "Gain +3 Grit and the first time each combat you would die, you instead live with 1 HP. This cannot be used to reduce self inflicted damage.",
        "desc": "+3 Grit; first death each combat becomes 1 HP."
      },
      {
        "mote": "Morae",
        "name": "All Seeing Eyes",
        "details": "Gain +3 Spirit and at the start of your turn select one enemy, you know how much HP it has.",
        "desc": "Gain +3 Spirit and at the start of your turn select one enemy, you know how much HP it has."
      },
      {
        "mote": "Morae",
        "name": "Doomed From The Start",
        "details": "Gain +4 Damage Resistance and whenever you take damage which ignores Damage Resistance, gain 1 BP.",
        "desc": "Gain +4 Damage Resistance and whenever you take damage which ignores Damage Resistance, gain 1 BP."
      },
      {
        "mote": "Morae",
        "name": "A Lone Lamb",
        "details": "[Boost X]{C} Before you take a minor action, enrage any enemy or number of enemies in an X block radius. They take X damage when they strike anyone but you until you die.",
        "desc": "X BP minor: enemies in radius take X damage if attacking others (until you drop)."
      },
      {
        "mote": "Morae",
        "name": "Martyr",
        "details": "At the start of your turn, you may select any ally within 6 blocks. When they take damage from a source other than themselves, you take half the damage and they take the other half. The damage you receive is not affected by DR. If  you are cleansed or the target is cleansed, this effect ends. You may end the effect at the end of any action.",
        "desc": "Start of turn: link ally within 6; split their non-self damage with you (your half ignores DR) until cleansed/ended."
      },
      {
        "mote": "Morae",
        "name": "Avenged",
        "details": "[Boost 2]{C} After you take damage, the source of that damage takes an additional amount of damage equal to your Spirit whenever they are targeted by you or your allies with strikes for the rest of combat.",
        "desc": "2 BP: mark damage source; they take +Spirit damage whenever attacked."
      },
      {
        "mote": "Morae",
        "name": "Fortune Teller",
        "details": "Gain 3 ‘Fortunes.’ When an ally or enemy rolls a d20, you can expend a fortune to make the roll a 1 or 20.",
        "desc": "Gain 3 Fortunes; spend one when someone rolls d20 to make it a 1 or 20."
      },
      {
        "mote": "Morae",
        "name": "Prediction",
        "details": "When you land a critical hit with a strike, declare an action. The target takes damage equal to your spirit each time they take that action. The same action may not be predicted twice at the same time. If the target is cleansed, the effect ends.",
        "desc": "On crit: declare an action; target takes Spirit damage each time they take it until cleansed (no duplicate predictions)."
      },
      {
        "mote": "Morae",
        "name": "Bonded by Unseen Threads",
        "details": "[Boost 3]{C} Link: When you target an enemy with an attack or cast action, the target is ‘linked.’ Every time you take damage, all creatures ‘linked’ by you take 1/2 of that damage as well.",
        "desc": "3 BP: link enemy; they take \u00bd of damage you take."
      },
      {
        "mote": "Morae",
        "name": "Sever Fate",
        "details": "When you land a critical hit, name an action. The target must spend 5 BP to use that action. If the target is cleansed, the effect ends.",
        "desc": "On crit: name an action; target must spend 5 BP to use it until cleansed."
      },
      {
        "mote": "Morae",
        "name": "Fate Casting",
      "details": "Gain 10 Mana, a Fate Casting Token and 2 other Casting Tokens of your choice. Also, learn 3 spells. You may take this ability more than once.",
      "desc": "10 Mana; Fate + 2 Tokens; learn 3 spells."
      },
      {
        "mote": "Morae",
        "name": "Fate Craft",
        "details": "Learn the following Enhancement: If you would hit with an attack, you instead crit. If you are the creator, then once per round when you glance with a strike you can choose to hit instead.",
        "desc": "Enhancement: hits become crits; if creator, 1/round a glance can become a hit."
      }

      ];

  /**
   * Initialize abilities data and organize by mote.
   */
  function initializeAbilitiesData() {
    // Organize abilities by mote
    abilitiesByMote = {"": [{"name": "", "desc": "", "details": ""}]};
    
    abilitiesData.forEach(ability => {
      const moteName = ability.mote;
      if (!abilitiesByMote[moteName]) {
        abilitiesByMote[moteName] = [];
      }
      abilitiesByMote[moteName].push({
        name: ability.name,
        desc: ability.desc,
        details: ability.details
      });
    });
    
    // Populate MOTE_OPTIONS with unique mote names
    const uniqueMotes = [...new Set(abilitiesData.map(ability => ability.mote))];
    MOTE_OPTIONS = [""].concat(uniqueMotes.sort());
    
    console.log('Abilities initialized successfully:', abilitiesByMote);
    console.log('Mote options:', MOTE_OPTIONS);
  }

  /**
   * Options shown in each Mote selector. Will be populated from JSON data.
   */
  let MOTE_OPTIONS = [""];

  /** How many ability slots to render under each Mote. */
  const ABILITIES_PER_MOTE = 6;

  /** Get the CSS theme class for a given mote name. */
  function getMoteThemeClass(moteName) {
    if (!moteName) return 'mote-theme-default';
    return `mote-theme-${moteName.toLowerCase()}`;
  }

  /** Get the CSS input theme class for a given mote name. */
  function getMoteInputThemeClass(moteName) {
    if (!moteName) return 'mote-input-default';
    return `mote-input-${moteName.toLowerCase()}`;
  }

  /** How many inventory rows to initialize. */
  const INVENTORY_ROWS = 12;

  /** How many enhancement rows to initialize. */
  const ENHANCEMENT_ROWS = 10;

  // =============================
  // Small DOM Utilities
  // =============================

  /** Create an element with optional className and innerHTML. */
  const el = (tag, cls = "", html = "") => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  };

  /** Create a styled input element. */
  const input = (attrs = {}) => {
    const i = document.createElement("input");
    Object.assign(i, attrs);
    i.className = `${attrs.className || ""} cell rounded-lg px-1 py-1 text-xs w-12 focus:ring-2 focus:ring-cyan-300`;
    // Add maxlength for number inputs to limit to 3 digits
    if (i.type === "number") {
      i.maxLength = 3;
      i.max = 999;
    }
    return i;
  };

  /** Create a styled select element with given option labels. */
  const select = (opts = [], attrs = {}) => {
    const s = document.createElement("select");
    Object.assign(s, attrs);
    s.className = `${attrs.className || ""} cell rounded-lg px-1 py-1 text-xs focus:ring-2 focus:ring-cyan-300`;
    opts.forEach((o) => {
      const op = document.createElement("option");
      op.value = o;
      op.textContent = o;
      s.appendChild(op);
    });
    return s;
  };

  /** Create a styled textarea element. */
  const textarea = (attrs = {}) => {
    const t = document.createElement("textarea");
    Object.assign(t, attrs);
    t.rows = attrs.rows || 3;
    t.className = `${attrs.className || ""} cell rounded-lg px-2 py-2 w-full text-xs focus:ring-2 focus:ring-cyan-300`;
    return t;
  };

  // =============================
  // Section Builders
  // =============================

  /** Build the core attributes table body. */
  function buildCoreAttributes(tbody) {
    CORE_ATTRS.forEach((label) => {
      const tr = el("tr", "border-t");
      tr.appendChild(el("td", "py-2 pr-2 font-medium", label));

      const base = input({ type: "number", value: 0, min: 0 });
      const mod = input({ type: "number", value: 0 });
      const temp = input({ type: "number", value: 0 });
      const level = input({ type: "number", value: 0 });
      const total = input({ type: "number", value: 0, readOnly: true });

      const recalc = () => {
        total.value = Number(base.value || 0) + Number(mod.value || 0) + Number(temp.value || 0) + Number(level.value || 0);
      };
      [base, mod, temp, level].forEach((i) => i.addEventListener("input", recalc));
      recalc();

      [base, mod, temp, level, total].forEach((ctrl) => {
        const td = el("td", "py-1 pr-1");
        td.appendChild(ctrl);
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  /** Build the calculated attributes table body. */
  function buildCalculatedAttributes(tbody) {
    CALC_ATTRS.forEach((def) => {
      const tr = el("tr", "border-t align-middle");
      tr.appendChild(el("td", "py-2 pr-2 font-medium", def.key));

      // Check if this attribute has a calculated base value
      let base;
      if (def.key === "Max HP") {
        base = input({ type: "number", value: 0, readOnly: true, className: "bg-gray-800/50" });
      } else if (def.key === "BP") {
        base = input({ type: "number", value: 0, readOnly: true, className: "bg-gray-800/50" });
      } else if (def.key === "AC") {
        base = input({ type: "number", value: 0, readOnly: true, className: "bg-gray-800/50" });
      } else if (def.key === "Speed") {
        base = input({ type: "number", value: 0, readOnly: true, className: "bg-gray-800/50" });
      } else {
        base = input({ type: "number", value: 0 });
      }
      
      const mod = input({ type: "number", value: 0 });
      const temp = input({ type: "number", value: 0 });
      
      // Attribute multiplier count input (0-4)
      const attrCount = input({ type: "number", value: 0, min: 0, max: 4, className: "w-12" });
      
      const mult = input({ type: "number", value: 1, step: "0.01", max: 9.99, className: "w-14" });
      const end = input({ type: "number", value: 0, readOnly: true });

      // Container for attribute multipliers
      const attrMultipliersContainer = el("div", "mt-1 space-y-1 px-2 py-1 bg-gray-800/30 rounded-lg");
      attrMultipliersContainer.style.display = "none"; // Initially hidden

      const extraTd = el("td", "py-1 pr-1");
      if (def.extra === "HP") {
        const hpNow = input({ type: "number", value: 0, placeholder: "HP", className: "w-12" });
        const currentLabel = el("div", "text-[10px] uppercase tracking-wider subtle", "Current");
        const hpWrap = el("div", "");
        hpWrap.appendChild(hpNow);
        hpWrap.appendChild(currentLabel);
        extraTd.appendChild(hpWrap);
      } else if (def.extra === "Current") {
        const currentValue = input({ type: "number", value: 0, placeholder: def.key, className: "w-12" });
        const currentLabel = el("div", "text-[10px] uppercase tracking-wider subtle", "Current");
        const currentWrap = el("div", "");
        currentWrap.appendChild(currentValue);
        currentWrap.appendChild(currentLabel);
        extraTd.appendChild(currentWrap);
      }

      // Function to create attribute multiplier elements
      function createAttrMultiplierElements() {
        const attrSelect = select(["Str", "Agi", "Gri", "Spi"], { className: "w-16 text-xs" });
        const multInput = input({ type: "number", value: 1, step: "0.01", className: "w-16" });
        
        return { attrSelect, multInput };
      }

      // Function to update attribute multipliers display
      function updateAttrMultipliers() {
        const count = Number(attrCount.value || 0);
        attrMultipliersContainer.innerHTML = "";
        
        if (count > 0) {
          attrMultipliersContainer.style.display = "block";
          
          // Create a single row container for all multipliers
          const multiplierRow = el("div", "flex gap-4 items-center flex-wrap");
          
          for (let i = 0; i < count; i++) {
            const { attrSelect, multInput } = createAttrMultiplierElements();
            
            // Create a group for each multiplier pair
            const multiplierGroup = el("div", "flex gap-1 items-center");
            multiplierGroup.appendChild(attrSelect);
            multiplierGroup.appendChild(el("span", "text-xs text-gray-400", "×"));
            multiplierGroup.appendChild(multInput);
            
            multiplierRow.appendChild(multiplierGroup);
            
            // Add event listeners for recalculation
            [attrSelect, multInput].forEach(input => {
              input.addEventListener("input", recalc);
            });
          }
          
          attrMultipliersContainer.appendChild(multiplierRow);
        } else {
          attrMultipliersContainer.style.display = "none";
        }
        
        recalc();
      }

      const recalc = () => {
        // Calculate base values for specific attributes
        if (def.key === "Max HP") {
          // Base HP = 6 × Grit Total + 30
          const gritRow = document.querySelector('#coreAttributes tr:nth-child(3)'); // Grit is 3rd core attribute
          const gritTotal = gritRow ? gritRow.querySelectorAll('input')[4].value || 0 : 0; // Total is 5th input (after adding Level)
          base.value = 6 * Number(gritTotal) + 30;
        } else if (def.key === "BP") {
          // Base BP = 2 × Spirit Total + 2
          const spiritRow = document.querySelector('#coreAttributes tr:nth-child(4)'); // Spirit is 4th core attribute
          const spiritTotal = spiritRow ? spiritRow.querySelectorAll('input')[4].value || 0 : 0; // Total is 5th input (after adding Level)
          base.value = 2 * Number(spiritTotal) + 2;
        } else if (def.key === "AC") {
          // Base AC = 10 + Agility Total
          const agilityRow = document.querySelector('#coreAttributes tr:nth-child(2)'); // Agility is 2nd core attribute
          const agilityTotal = agilityRow ? agilityRow.querySelectorAll('input')[4].value || 0 : 0; // Total is 5th input (after adding Level)
          base.value = 10 + Number(agilityTotal);
        } else if (def.key === "Speed") {
          // Base Speed = Speed Total
          const speedRow = document.querySelector('#coreAttributes tr:nth-child(5)'); // Speed is 5th core attribute
          const speedTotal = speedRow ? speedRow.querySelectorAll('input')[4].value || 0 : 0; // Total is 5th input (after adding Level)
          base.value = Number(speedTotal);
        }
        
        // Calculate attribute multipliers
        let attrSum = 0;
        const multiplierGroups = attrMultipliersContainer.querySelectorAll("div.flex.gap-1");
        multiplierGroups.forEach(group => {
          const attrSelect = group.querySelector("select");
          const multInput = group.querySelector("input[type='number']");
          
          if (attrSelect && multInput) {
            const attrType = attrSelect.value;
            const multiplier = Number(multInput.value || 0);
            
            // Get the corresponding core attribute value
            let coreAttrValue = 0;
            if (attrType === "Str") {
              const strengthRow = document.querySelector('#coreAttributes tr:nth-child(1)'); // Strength is 1st core attribute
              coreAttrValue = strengthRow ? Number(strengthRow.querySelectorAll('input')[4].value || 0) : 0;
            } else if (attrType === "Agi") {
              const agilityRow = document.querySelector('#coreAttributes tr:nth-child(2)'); // Agility is 2nd core attribute
              coreAttrValue = agilityRow ? Number(agilityRow.querySelectorAll('input')[4].value || 0) : 0;
            } else if (attrType === "Gri") {
              const gritRow = document.querySelector('#coreAttributes tr:nth-child(3)'); // Grit is 3rd core attribute
              coreAttrValue = gritRow ? Number(gritRow.querySelectorAll('input')[4].value || 0) : 0;
            } else if (attrType === "Spi") {
              const spiritRow = document.querySelector('#coreAttributes tr:nth-child(4)'); // Spirit is 4th core attribute
              coreAttrValue = spiritRow ? Number(spiritRow.querySelectorAll('input')[4].value || 0) : 0;
            }
            
            attrSum += coreAttrValue * multiplier;
          }
        });
        
        const sum = Number(base.value || 0) + Number(mod.value || 0) + Number(temp.value || 0) + attrSum;
        const m = Number(mult.value || 1);
        end.value = Math.ceil(sum * m);
      };

      // Add event listeners
      [base, mod, temp, mult, attrCount].forEach((i) => i.addEventListener("input", recalc));
      
      // Special handling for attrCount to update multipliers display
      attrCount.addEventListener("input", updateAttrMultipliers);
      
      // For calculated base values, also listen to core attribute changes
      if (def.key === "Max HP" || def.key === "BP" || def.key === "AC" || def.key === "Speed") {
        // Listen for changes to core attributes
        const coreAttributes = document.querySelectorAll('#coreAttributes input');
        coreAttributes.forEach(input => {
          input.addEventListener('input', recalc);
        });
      }
      
      recalc();

      // Create the main row cells
      [base, mod, temp, attrCount, mult, end].forEach((ctrl) => {
        const td = el("td", "py-1 pr-1");
        const ctrlWrap = el("div", "");
        ctrlWrap.appendChild(ctrl);
        // Add blank space to match the HP "Current" label
        const blankLabel = el("div", "text-[10px] uppercase tracking-wider subtle", " ");
        ctrlWrap.appendChild(blankLabel);
        td.appendChild(ctrlWrap);
        tr.appendChild(td);
      });

      tr.appendChild(extraTd);
      
      // Add empty cell for multipliers column in main row
      const emptyAttrTd = el("td", "py-1 pr-1", "");
      tr.appendChild(emptyAttrTd);
      
      tbody.appendChild(tr);
      
      // Add the attribute multipliers container as a separate row
      const attrRow = el("tr", "");
      const attrTd = el("td", "py-0 pr-1", "");
      attrTd.colSpan = 9; // Span across all columns
      attrTd.appendChild(attrMultipliersContainer);
      attrRow.appendChild(attrTd);
      tbody.appendChild(attrRow);
    });
  }

  /** Build inventory rows. */
  function buildInventory(container, rows = INVENTORY_ROWS) {
    for (let i = 0; i < rows; i++) {
      const row = el("div", "grid grid-cols-5 gap-2");
      const name = input({ placeholder: "Name", className: "col-span-2" });
      const desc = textarea({ placeholder: "Description", rows: 2, className: "col-span-3" });
      row.appendChild(name);
      row.appendChild(desc);
      container.appendChild(row);
    }
  }

  /** Build a single Mote column with dropdown + dynamic ability slots. */
  function buildMote(container) {
    container.appendChild(el("h3", "text-lg font-semibold mb-3", "Mote"));

    const moteSel = select(MOTE_OPTIONS);
    moteSel.classList.add("w-full");
    container.appendChild(moteSel);

    const abilitiesWrap = el("div", "mt-3 space-y-3");
    abilitiesWrap.id = container.id + "-abilities";
    container.appendChild(abilitiesWrap);

    // Add initial ability (motes must have at least one)
    addMoteAbility(abilitiesWrap, moteSel);

    // Add button for more abilities
    const addBtn = el("button", "mt-3 rounded-xl px-4 py-2.5 bg-cyan-500/20 border border-cyan-300/30 hover:bg-cyan-500/30 text-sm");
    addBtn.textContent = "Add Ability";
    addBtn.onclick = () => addMoteAbility(abilitiesWrap, moteSel);
    container.appendChild(addBtn);

    // Populate ability dropdowns based on chosen mote.
    function repopulate() {
      const list = abilitiesByMote[moteSel.value] || [{"name": "", "desc": "", "details": ""}];
      const abilitySelects = abilitiesWrap.querySelectorAll("select");
      const abilityDescs = abilitiesWrap.querySelectorAll("textarea");
      
      // Update theme for all ability cards (only target ability card divs, not all divs)
      const abilityCards = abilitiesWrap.querySelectorAll("div.pt-4.pb-8.px-4.rounded-xl.border.relative");
      const newThemeClass = getMoteThemeClass(moteSel.value);
      const newInputThemeClass = getMoteInputThemeClass(moteSel.value);
      
      // Remove all existing mote theme classes
      abilityCards.forEach(card => {
        card.classList.remove(...Array.from(card.classList).filter(cls => cls.startsWith('mote-theme-')));
        card.classList.add(newThemeClass);
        
        // Update input/textarea themes
        const select = card.querySelector('select');
        const textarea = card.querySelector('textarea');
        if (select) {
          select.classList.remove(...Array.from(select.classList).filter(cls => cls.startsWith('mote-input-')));
          select.classList.add(newInputThemeClass);
        }
        if (textarea) {
          // Remove any mote-input classes from textarea - let it use parent container's .mote-theme-default textarea CSS rule
          textarea.classList.remove(...Array.from(textarea.classList).filter(cls => cls.startsWith('mote-input-')));
        }
      });
      
      abilitySelects.forEach((sel, index) => {
        sel.innerHTML = "";
        list.forEach((ability) => {
          const op = document.createElement("option");
          op.value = ability.name;
          op.textContent = ability.name;
          op.dataset.desc = ability.desc; // Store description in data attribute
          op.dataset.details = ability.details; // Store details in data attribute
          sel.appendChild(op);
        });
        
        // Update corresponding description
        if (abilityDescs[index]) {
          abilityDescs[index].value = list[0].desc || "";
          // Trigger auto-resize for textarea
          abilityDescs[index].dispatchEvent(new Event('input'));
        }
        
        // Reset info button state
        const infoBtn = sel.parentElement.querySelector(".info-btn");
        if (infoBtn) {
          infoBtn.classList.remove("bg-cyan-500", "text-white");
          infoBtn.classList.add("bg-gray-600", "text-gray-300");
        }
      });
    }

    moteSel.addEventListener("change", () => {
      repopulate();
      validateMoteSelections();
      validateAbilitySelections();
    });
    repopulate();
  }

  /** Add a new ability to a mote. */
  function addMoteAbility(abilitiesWrap, moteSel) {
    const abilityCard = el("div", "pt-4 pb-8 px-4 rounded-xl border relative");
    abilityCard.id = `mote-ability-${Date.now()}`;
    // Apply mote theme
    const themeClass = getMoteThemeClass(moteSel.value);
    abilityCard.classList.add(themeClass);
    
    // Create ability selector
    const abilitySel = select([""], { className: "w-full mb-4 text-white" });
    // Apply mote input theme
    const inputThemeClass = getMoteInputThemeClass(moteSel.value);
    abilitySel.classList.add(inputThemeClass);
    
    // Create delete button (only if there's more than one ability) - positioned at bottom right
    const deleteBtn = el("button", "absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-red-500/20 border border-red-300/30 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-colors");
    deleteBtn.innerHTML = "×";
    deleteBtn.title = "Delete ability";
    deleteBtn.onclick = () => {
      // Only allow deletion if there's more than one ability
      if (abilitiesWrap.children.length > 1) {
        abilityCard.remove();
        updateDeleteButtons(abilitiesWrap);
        validateAbilitySelections();
      }
    };
    
    // Create description container
    const descContainer = el("div", "relative");
    const desc = textarea({ placeholder: "Ability Description", rows: 2, readOnly: true, className: "w-full resize-none overflow-hidden text-white bg-transparent" });
    // Don't apply mote input theme to textarea - let it use the parent container's .mote-theme-default textarea CSS rule
    
    // Create info button (positioned within the card, not the textarea)
    const infoBtn = el("button", "absolute bottom-2 left-2 w-6 h-6 rounded-full bg-gray-600 text-gray-300 hover:bg-gray-500 flex items-center justify-center text-xs font-bold info-btn");
    infoBtn.innerHTML = "i";
    infoBtn.title = "Toggle detailed description";
    
    // Function to auto-resize textarea based on content
    function autoResizeTextarea() {
      desc.style.height = 'auto';
      const scrollHeight = desc.scrollHeight;
      const minHeight = 48; // 2 rows worth
      const maxHeight = 200; // Maximum height before scrolling
      desc.style.height = Math.min(Math.max(scrollHeight, minHeight), maxHeight) + 'px';
    }
    
    // Add toggle functionality
    let isDetailedMode = false;
    infoBtn.onclick = () => {
      const selectedOption = abilitySel.options[abilitySel.selectedIndex];
      if (selectedOption && selectedOption.dataset.details) {
        isDetailedMode = !isDetailedMode;
        if (isDetailedMode) {
          desc.value = selectedOption.dataset.details;
          infoBtn.classList.remove("bg-gray-600", "text-gray-300");
          infoBtn.classList.add("bg-cyan-500", "text-white");
        } else {
          desc.value = selectedOption.dataset.desc || "";
          infoBtn.classList.remove("bg-cyan-500", "text-white");
          infoBtn.classList.add("bg-gray-600", "text-gray-300");
        }
        // Auto-resize after content change
        setTimeout(autoResizeTextarea, 10);
      }
    };
    
    // Populate the selector based on current mote selection
    const list = abilitiesByMote[moteSel.value] || [{"name": "", "desc": "", "details": ""}];
    list.forEach((ability) => {
      const op = document.createElement("option");
      op.value = ability.name;
      op.textContent = ability.name;
      op.dataset.desc = ability.desc;
      op.dataset.details = ability.details;
      abilitySel.appendChild(op);
    });
    
    // Add event listener to update description when ability is selected
    abilitySel.addEventListener("change", () => {
      const selectedOption = abilitySel.options[abilitySel.selectedIndex];
      isDetailedMode = false; // Reset to basic description
      desc.value = selectedOption.dataset.desc || "";
      // Reset info button state
      infoBtn.classList.remove("bg-cyan-500", "text-white");
      infoBtn.classList.add("bg-gray-600", "text-gray-300");
        // Auto-resize after content change
        setTimeout(autoResizeTextarea, 10);
        // Validate selections after ability change
        validateAbilitySelections();
      });
    
    // Assemble description container
    descContainer.appendChild(desc);
    
    // Assemble the ability card
    abilityCard.appendChild(deleteBtn);
    abilityCard.appendChild(infoBtn);
    abilityCard.appendChild(abilitySel);
    abilityCard.appendChild(descContainer);
    abilitiesWrap.appendChild(abilityCard);
    
    // Add drag handle
    addDragHandle(abilityCard);
    
    // Update delete button visibility and validate selections
    updateDeleteButtons(abilitiesWrap);
    validateAbilitySelections();
  }

  /** Update delete button visibility based on number of abilities. */
  function updateDeleteButtons(abilitiesWrap) {
    const abilityCards = abilitiesWrap.querySelectorAll("div.pt-4.pb-8.px-4.rounded-xl.border.relative");
    abilityCards.forEach((card, index) => {
      const deleteBtn = card.querySelector("button");
      if (deleteBtn) {
        // Hide delete button if this is the only ability
        deleteBtn.style.display = abilityCards.length > 1 ? "flex" : "none";
      }
    });
  }

  /** Build Known Enhancements (start with one). */
  function buildEnhancements(container) {
    // Start with one enhancement (required minimum)
    addEnhancement();
  }

  /** Add a new enhancement when user clicks the button. */
  function addEnhancement() {
    const enhancements = document.getElementById("enhancements");
    const newEnhancement = document.createElement("div");
    newEnhancement.className = "p-3 rounded-xl border border-white/10 bg-white/5 relative";
    newEnhancement.id = `enhancement-${Date.now()}`;
    
    // Create delete button (only if there's more than one enhancement)
    const deleteBtn = el("button", "absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 border border-red-300/30 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-colors");
    deleteBtn.innerHTML = "×";
    deleteBtn.title = "Delete enhancement";
    deleteBtn.onclick = () => {
      // Only allow deletion if there's more than one enhancement
      if (enhancements.children.length > 1) {
        newEnhancement.remove();
        updateEnhancementDeleteButtons();
      }
    };
    
    // Create form fields with custom layout: Name (full row), Cost+Item (same row), Effect (full row)
    const fieldsContainer = el("div", "space-y-3 pr-8");
    
    const nameField = input({ placeholder: "Name", className: "w-full" });
    
    // Cost and Item on the same row
    const costItemRow = el("div", "grid grid-cols-2 gap-2");
    const costField = input({ type: "text", placeholder: "Cost", className: "w-full" });
    const itemField = input({ placeholder: "Item", className: "w-full" });
    costItemRow.appendChild(costField);
    costItemRow.appendChild(itemField);
    
    const effectField = textarea({ placeholder: "Effect", rows: 1, className: "w-full resize-none overflow-hidden" });
    
    // Function to auto-resize textarea based on content
    function autoResizeTextarea() {
      effectField.style.height = 'auto';
      const scrollHeight = effectField.scrollHeight;
      const minHeight = 40; // Single row height
      const maxHeight = 200; // Maximum height before scrolling
      effectField.style.height = Math.min(Math.max(scrollHeight, minHeight), maxHeight) + 'px';
    }
    
    // Add auto-resize functionality
    effectField.addEventListener('input', autoResizeTextarea);
    effectField.addEventListener('paste', () => {
      // Small delay to allow paste content to be processed
      setTimeout(autoResizeTextarea, 10);
    });
    
    fieldsContainer.appendChild(nameField);
    fieldsContainer.appendChild(costItemRow);
    fieldsContainer.appendChild(effectField);
    
    // Assemble the enhancement
    newEnhancement.appendChild(deleteBtn);
    newEnhancement.appendChild(fieldsContainer);
    enhancements.appendChild(newEnhancement);
    
    // Add drag handle
    addDragHandle(newEnhancement);
    
    // Update delete button visibility
    updateEnhancementDeleteButtons();
  }

  /** Update enhancement delete button visibility based on number of enhancements. */
  function updateEnhancementDeleteButtons() {
    const enhancements = document.getElementById("enhancements");
    const enhancementCards = enhancements.querySelectorAll("div");
    enhancementCards.forEach((card) => {
      const deleteBtn = card.querySelector("button");
      if (deleteBtn) {
        // Hide delete button if this is the only enhancement
        deleteBtn.style.display = enhancementCards.length > 1 ? "flex" : "none";
      }
    });
    
  }

  /** Build Masteries (start with one). */
  function buildMasteries(container) {
    // Start with one mastery (required minimum)
    addMastery();
  }

  /** Add a new mastery when user clicks the button. */
  function addMastery() {
    const masteries = document.getElementById("masteries");
    const newMastery = document.createElement("div");
    newMastery.className = "p-3 rounded-xl border border-white/10 bg-white/5 relative";
    newMastery.id = `mastery-${Date.now()}`;
    
    // Create delete button (only if there's more than one mastery)
    const deleteBtn = el("button", "absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 border border-red-300/30 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-colors");
    deleteBtn.innerHTML = "×";
    deleteBtn.title = "Delete mastery";
    deleteBtn.onclick = () => {
      // Only allow deletion if there's more than one mastery
      if (masteries.children.length > 1) {
        newMastery.remove();
        updateMasteryDeleteButtons();
      }
    };
    
    // Create form fields in a grid layout (only 2 columns: Name and Effect)
    const fieldsContainer = el("div", "grid grid-cols-2 gap-2 pr-8");
    
    const nameField = input({ placeholder: "Name", className: "w-full" });
    const effectField = input({ placeholder: "Effect", className: "w-full" });
    
    fieldsContainer.appendChild(nameField);
    fieldsContainer.appendChild(effectField);
    
    // Assemble the mastery
    newMastery.appendChild(deleteBtn);
    newMastery.appendChild(fieldsContainer);
    masteries.appendChild(newMastery);
    
    // Add drag handle
    addDragHandle(newMastery);
    
    // Update delete button visibility
    updateMasteryDeleteButtons();
  }

  /** Add a new trigger card when user clicks the button. */
  function addTrigger() {
    const triggers = document.getElementById("triggers");
    const newTrigger = document.createElement("div");
    newTrigger.className = "p-4 rounded-xl border border-white/10 bg-white/5 relative";
    newTrigger.id = `trigger-${Date.now()}`;
    
    // Create delete button for the entire trigger card
    const deleteBtn = el("button", "absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 border border-red-300/30 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-colors");
    deleteBtn.innerHTML = "×";
    deleteBtn.title = "Delete trigger";
    deleteBtn.onclick = () => newTrigger.remove();
    
    // Create trigger name input (large)
    const nameField = input({ placeholder: "Trigger Name", className: "w-full text-lg font-semibold mb-3" });
    
    // Create elements container
    const elementsContainer = el("div", "space-y-2 mb-3");
    elementsContainer.id = `trigger-elements-${Date.now()}`;
    
    // Create add element button
    const addElementBtn = el("button", "w-full rounded-lg px-3 py-2 bg-cyan-500/20 border border-cyan-300/30 hover:bg-cyan-500/30 text-cyan-300 text-sm");
    addElementBtn.textContent = "Add Element";
    addElementBtn.onclick = () => addTriggerElement(elementsContainer);
    
    // Assemble the trigger card
    newTrigger.appendChild(deleteBtn);
    newTrigger.appendChild(nameField);
    newTrigger.appendChild(elementsContainer);
    newTrigger.appendChild(addElementBtn);
    triggers.appendChild(newTrigger);
    
    // Add drag handle
    addDragHandle(newTrigger);
  }

  /** Add a new element to a trigger card. */
  function addTriggerElement(container) {
    const elementDiv = el("div", "flex gap-2 items-center p-2 rounded-lg bg-gray-800/30 border border-white/5");
    
    const elementInput = input({ placeholder: "Element", className: "flex-1" });
    const deleteElementBtn = el("button", "w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 border border-red-300/30 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-colors");
    deleteElementBtn.innerHTML = "×";
    deleteElementBtn.title = "Delete element";
    deleteElementBtn.onclick = () => elementDiv.remove();
    
    elementDiv.appendChild(elementInput);
    elementDiv.appendChild(deleteElementBtn);
    container.appendChild(elementDiv);
  }

  /** Update mastery delete button visibility based on number of masteries. */
  function updateMasteryDeleteButtons() {
    const masteries = document.getElementById("masteries");
    const masteryCards = masteries.querySelectorAll("div");
    masteryCards.forEach((card) => {
      const deleteBtn = card.querySelector("button");
      if (deleteBtn) {
        // Hide delete button if this is the only mastery
        deleteBtn.style.display = masteryCards.length > 1 ? "flex" : "none";
      }
    });
    
  }

  /** Build Mind Alterations rows (fixed at 3). */
  function buildMindAlterations(container) {
    for (let i = 0; i < 3; i++) {
      const row = el("div", "space-y-2");
      const name = input({ placeholder: "Name", className: "w-full" });
      const desc = textarea({ placeholder: "Description", rows: 3, className: "w-full" });
      row.appendChild(name);
      row.appendChild(desc);
      container.appendChild(row);
    }
  }

  /** Build Mind Breaks cards (start with one). */
  function buildMindBreaks(container) {
    // Start with one mind break (required minimum)
    addMindBreak();
  }

  // =============================
  // Export / Import Functions
  // =============================

  /**
   * Remove empty strings and zero values from an object
   */
  function removeEmptyValues(obj) {
    if (Array.isArray(obj)) {
      return obj.map(removeEmptyValues).filter(item => {
        if (typeof item === 'object' && item !== null) {
          return Object.keys(item).length > 0;
        }
        return true;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === "" || value === "0" || value === 0) {
          // Skip empty strings and zero values
          continue;
        }
        if (Array.isArray(value)) {
          const cleanedArray = removeEmptyValues(value);
          if (cleanedArray.length > 0) {
            cleaned[key] = cleanedArray;
          }
        } else if (typeof value === 'object' && value !== null) {
          const cleanedObj = removeEmptyValues(value);
          if (Object.keys(cleanedObj).length > 0) {
            cleaned[key] = cleanedObj;
          }
        } else {
          cleaned[key] = value;
        }
      }
      return cleaned;
    }
    return obj;
  }

  /**
   * Helper to check if a value should be included in export (not empty, but allow 0)
   */
  function shouldInclude(value) {
    // Only exclude empty strings, null, or undefined
    // Allow 0 and "0" as valid values to export
    return value !== "" && value !== null && value !== undefined;
  }

  /**
   * Convert full field names to compact one-character field names
   */
  function toCompactFormat(data) {
    const compact = {};
    
    // Top-level fields
    if (shouldInclude(data.name)) compact.n = data.name;
    if (shouldInclude(data.level)) compact.l = data.level;
    if (shouldInclude(data.exp)) compact.e = data.exp;
    if (shouldInclude(data.race)) compact.r = data.race;
    if (shouldInclude(data.masteryValue)) compact.v = data.masteryValue;
    
    // Core attributes
    if (data.core && data.core.length > 0) {
      compact.c = data.core.map(attr => {
        const c = {};
        if (shouldInclude(attr.base)) c.b = attr.base;
        if (shouldInclude(attr.mod)) c.m = attr.mod;
        if (shouldInclude(attr.temp)) c.t = attr.temp;
        if (shouldInclude(attr.level)) c.l = attr.level;
        if (shouldInclude(attr.total)) c.o = attr.total;
        return c;
      }).filter(c => Object.keys(c).length > 0);
      if (compact.c.length === 0) delete compact.c;
    }
    
    // Calculated attributes
    if (data.calc && data.calc.length > 0) {
      compact.k = data.calc.map(attr => {
        const c = {};
        if (shouldInclude(attr.base)) c.b = attr.base;
        if (shouldInclude(attr.mod)) c.m = attr.mod;
        if (shouldInclude(attr.temp)) c.t = attr.temp;
        if (shouldInclude(attr.attrCount) && attr.attrCount !== "0") c.c = attr.attrCount;
        if (attr.attrMultipliers && attr.attrMultipliers.length > 0) {
          c.a = attr.attrMultipliers.map(am => {
            const a = {};
            if (shouldInclude(am.attr)) a.a = am.attr;
            if (shouldInclude(am.mult)) a.m = am.mult;
            return a;
          }).filter(a => Object.keys(a).length > 0);
          if (c.a.length === 0) delete c.a;
        }
        if (shouldInclude(attr.mult)) c.u = attr.mult;
        if (shouldInclude(attr.end)) c.e = attr.end;
        if (shouldInclude(attr.extra)) c.x = attr.extra;
        return c;
      }).filter(c => Object.keys(c).length > 0);
      if (compact.k.length === 0) delete compact.k;
    }
    
    // Inventory
    if (data.inventory && data.inventory.length > 0) {
      compact.i = data.inventory.map(item => {
        const c = {};
        if (shouldInclude(item.name)) c.n = item.name;
        if (shouldInclude(item.desc)) c.d = item.desc;
        return c;
      }).filter(c => Object.keys(c).length > 0);
      if (compact.i.length === 0) delete compact.i;
    }
    
    // Motes
    if (data.motes && data.motes.length > 0) {
      compact.m = data.motes.map(mote => {
        const c = {};
        if (shouldInclude(mote.mote)) c.m = mote.mote;
        if (mote.abilities && mote.abilities.length > 0) {
          c.a = mote.abilities.map(ability => {
            // Only export ability name, not description (can be looked up from database)
            if (shouldInclude(ability.ability)) return ability.ability;
            return null;
          }).filter(a => a !== null);
          if (c.a.length === 0) delete c.a;
        }
        return c;
      }).filter(c => Object.keys(c).length > 0);
      if (compact.m.length === 0) delete compact.m;
    }
    
    // Enhancements
    if (data.enhancements && data.enhancements.length > 0) {
      compact.h = data.enhancements.map(enh => {
        const c = {};
        if (shouldInclude(enh.name)) c.n = enh.name;
        if (shouldInclude(enh.cost)) c.c = enh.cost;
        if (shouldInclude(enh.item)) c.i = enh.item;
        if (shouldInclude(enh.effect)) c.e = enh.effect;
        return c;
      }).filter(c => Object.keys(c).length > 0);
      if (compact.h.length === 0) delete compact.h;
    }
    
    // Masteries
    if (data.masteries && data.masteries.length > 0) {
      compact.t = data.masteries.map(mast => {
        const c = {};
        if (shouldInclude(mast.name)) c.n = mast.name;
        if (shouldInclude(mast.effect)) c.e = mast.effect;
        return c;
      }).filter(c => Object.keys(c).length > 0);
      if (compact.t.length === 0) delete compact.t;
    }
    
    // Triggers
    if (data.triggers && data.triggers.length > 0) {
      compact.g = data.triggers.map(trig => {
        const c = {};
        if (shouldInclude(trig.name)) c.n = trig.name;
        if (trig.elements && trig.elements.length > 0) {
          c.e = trig.elements.filter(e => shouldInclude(e));
          if (c.e.length === 0) delete c.e;
        }
        return c;
      }).filter(c => Object.keys(c).length > 0);
      if (compact.g.length === 0) delete compact.g;
    }
    
    // Mind alterations
    if (data.mindAlterations && data.mindAlterations.length > 0) {
      compact.a = data.mindAlterations.map(alt => {
        const c = {};
        if (shouldInclude(alt.name)) c.n = alt.name;
        if (shouldInclude(alt.desc)) c.d = alt.desc;
        return c;
      }).filter(c => Object.keys(c).length > 0);
      if (compact.a.length === 0) delete compact.a;
    }
    
    // Mind breaks
    if (data.mindBreaks && data.mindBreaks.length > 0) {
      compact.b = data.mindBreaks.map(brk => {
        const c = {};
        if (shouldInclude(brk.name)) c.n = brk.name;
        if (shouldInclude(brk.desc)) c.d = brk.desc;
        return c;
      }).filter(c => Object.keys(c).length > 0);
      if (compact.b.length === 0) delete compact.b;
    }
    
    return compact;
  }

  /**
   * Convert compact one-character field names to full field names
   */
  function fromCompactFormat(compact) {
    const data = {
      name: safeValue(compact.n),
      level: safeValue(compact.l),
      exp: safeValue(compact.e),
      race: safeValue(compact.r),
      core: [],
      calc: [],
      inventory: [],
      motes: [],
      enhancements: [],
      masteries: [],
      masteryValue: safeValue(compact.v),
      triggers: [],
      mindAlterations: [],
      mindBreaks: []
    };
    
    // Core attributes
    if (compact.c && Array.isArray(compact.c)) {
      data.core = compact.c.map(attr => ({
        base: safeValue(attr.b),
        mod: safeValue(attr.m),
        temp: safeValue(attr.t),
        level: safeValue(attr.l),
        total: safeValue(attr.o)
      }));
    }
    
    // Calculated attributes
    if (compact.k && Array.isArray(compact.k)) {
      data.calc = compact.k.map(attr => ({
        base: safeValue(attr.b),
        mod: safeValue(attr.m),
        temp: safeValue(attr.t),
        attrCount: safeValue(attr.c, "0"),
        attrMultipliers: (attr.a && Array.isArray(attr.a)) ? attr.a.map(am => ({
          attr: safeValue(am.a),
          mult: safeValue(am.m)
        })) : [],
        mult: safeValue(attr.u),
        end: safeValue(attr.e),
        extra: safeValue(attr.x)
      }));
    }
    
    // Inventory
    if (compact.i && Array.isArray(compact.i)) {
      data.inventory = compact.i.map(item => ({
        name: item.n || "",
        desc: item.d || ""
      }));
    }
    
    // Motes
    if (compact.m && Array.isArray(compact.m)) {
      data.motes = compact.m.map(mote => ({
        mote: mote.m || "",
        abilities: (mote.a && Array.isArray(mote.a)) ? mote.a.map(ability => {
          // Handle different ability formats:
          // 1. String (new compact format - just ability name)
          // 2. Object with 'a' and 'd' (old compact format with desc)
          // 3. Object with 'ability' and 'desc' (legacy format - shouldn't happen here but handle it)
          if (typeof ability === 'string') {
            // New format: just the ability name, desc will be looked up during import
            return {
              ability: ability,
              desc: "" // Will be populated from database during import
            };
          } else if (ability.a !== undefined) {
            // Old compact format with description
            return {
              ability: ability.a || "",
              desc: ability.d || ""
            };
          } else {
            // Fallback for any other format
            return {
              ability: ability.ability || "",
              desc: ability.desc || ""
            };
          }
        }) : []
      }));
    }
    
    // Enhancements
    if (compact.h && Array.isArray(compact.h)) {
      data.enhancements = compact.h.map(enh => ({
        name: enh.n || "",
        cost: enh.c || "",
        item: enh.i || "",
        effect: enh.e || ""
      }));
    }
    
    // Masteries
    if (compact.t && Array.isArray(compact.t)) {
      data.masteries = compact.t.map(mast => ({
        name: mast.n || "",
        effect: mast.e || ""
      }));
    }
    
    // Triggers
    if (compact.g && Array.isArray(compact.g)) {
      data.triggers = compact.g.map(trig => ({
        name: trig.n || "",
        elements: trig.e || []
      }));
    }
    
    // Mind alterations
    if (compact.a && Array.isArray(compact.a)) {
      data.mindAlterations = compact.a.map(alt => ({
        name: alt.n || "",
        desc: alt.d || ""
      }));
    }
    
    // Mind breaks
    if (compact.b && Array.isArray(compact.b)) {
      data.mindBreaks = compact.b.map(brk => ({
        name: brk.n || "",
        desc: brk.d || ""
      }));
    }
    
    return data;
  }

  /**
   * Detect if the imported data is in compact format or legacy format
   */
  function isCompactFormat(data) {
    // Check for compact field names (single characters)
    // If it has 'n' for name but not 'name', it's compact
    return (data.n !== undefined || data.c !== undefined || data.k !== undefined) && 
           (data.name === undefined && data.core === undefined && data.calc === undefined);
  }

  /**
   * Helper to safely get a value, preserving "0" and 0 but defaulting empty/null/undefined to ""
   */
  function safeValue(value, defaultValue = "") {
    if (value === null || value === undefined || value === "") {
      return defaultValue;
    }
    // Preserve both string "0" and number 0
    return String(value);
  }

  /** Export character data as a simple string format */
  function exportCharacter() {
    const data = {
      // Basic info
      name: document.getElementById("charName").value || "",
      level: document.getElementById("level").value || "",
      exp: document.getElementById("exp").value || "",
      race: document.getElementById("race").value || "",
      
      // Core attributes
      core: [],
      // Calculated attributes  
      calc: [],
      // Inventory items
      inventory: [],
      // Mote abilities
      motes: [],
      // Enhancements
      enhancements: [],
      // Masteries
      masteries: [],
      // Mastery value
      masteryValue: "",
      // Triggers
      triggers: [],
      // Mind alterations
      mindAlterations: [],
      // Mind breaks
      mindBreaks: []
    };

    // Collect core attributes
    const coreRows = document.querySelectorAll('#coreAttributes tr');
    coreRows.forEach(row => {
      const inputs = row.querySelectorAll('input');
      if (inputs.length >= 5) {
        data.core.push({
          base: inputs[0].value || "",
          mod: inputs[1].value || "",
          temp: inputs[2].value || "",
          level: inputs[3].value || "",
          total: inputs[4].value || ""
        });
      }
    });

    // Collect calculated attributes
    const calcRows = document.querySelectorAll('#calcAttributes tr');
    let currentAttrIndex = 0;
    calcRows.forEach((row, index) => {
      // Skip attribute multiplier rows (they are odd indices after the main rows)
      if (index % 2 === 1) return;
      
      const inputs = row.querySelectorAll('input');
      if (inputs.length >= 6) {
        const extraInput = row.querySelector('td:nth-last-child(2) input'); // Second to last column
        const attrCount = inputs[3].value || "0";
        
        // Collect attribute multipliers from the next row
        const attrMultipliers = [];
        const nextRow = calcRows[index + 1];
        if (nextRow && Number(attrCount) > 0) {
          const attrMultipliersContainer = nextRow.querySelector('td div.mt-2');
          if (attrMultipliersContainer) {
            const multiplierGroups = attrMultipliersContainer.querySelectorAll('div.flex.gap-1');
            multiplierGroups.forEach(group => {
              const attrSelect = group.querySelector('select');
              const multInput = group.querySelector('input[type="number"]');
              if (attrSelect && multInput) {
                attrMultipliers.push({
                  attr: attrSelect.value || "",
                  mult: multInput.value || ""
                });
              }
            });
          }
        }
        
        data.calc.push({
          base: inputs[0].value || "",
          mod: inputs[1].value || "",
          temp: inputs[2].value || "",
          attrCount: attrCount,
          attrMultipliers: attrMultipliers,
          mult: inputs[4].value || "",
          end: inputs[5].value || "",
          extra: extraInput ? extraInput.value || "" : ""
        });
        currentAttrIndex++;
      }
    });

    // Collect inventory items
    const inventoryItems = document.querySelectorAll('#inventory > div');
    inventoryItems.forEach(item => {
      const inputs = item.querySelectorAll('input, textarea');
      if (inputs.length >= 2) {
        data.inventory.push({
          name: inputs[0].value || "",
          desc: inputs[1].value || ""
        });
      }
    });

    // Collect mote abilities - check all mote containers that exist
    for (let moteNum = 1; moteNum <= 10; moteNum++) { // Check up to 10 motes to be safe
      const moteContainer = document.getElementById(`mote-${moteNum}`);
      if (moteContainer) {
        const moteSelect = moteContainer.querySelector('select');
        // Find the abilities wrapper div (it has mt-3 class)
        const abilitiesWrap = moteContainer.querySelector('div.mt-3');
        // Select only ability cards that have both select and textarea elements
        const abilityCards = abilitiesWrap ? 
          Array.from(abilitiesWrap.children).filter(card => 
            card.querySelector('select') && card.querySelector('textarea')
          ) : [];
        const moteData = {
          mote: moteSelect ? moteSelect.value : "",
          abilities: []
        };
        
        abilityCards.forEach((card, index) => {
          const select = card.querySelector('select');
          const textarea = card.querySelector('textarea');
          console.log(`Mote ${moteNum}, Ability ${index}: select=${!!select}, textarea=${!!textarea}, ability="${select?.value || ''}", desc="${textarea?.value || ''}"`);
          if (select && textarea) {
            moteData.abilities.push({
              ability: select.value || "",
              desc: textarea.value || ""
            });
          } else {
            console.log(`Mote ${moteNum}, Ability ${index}: SKIPPED - missing select or textarea`);
          }
        });
        
        // Debug: log what we found
        console.log(`Mote ${moteNum}: Found ${abilityCards.length} ability cards, exported ${moteData.abilities.length} abilities`);
        
        data.motes.push(moteData);
      } else {
        break; // Stop if we hit a non-existent mote container
      }
    }

    // Collect enhancements
    const enhancementItems = document.querySelectorAll('#enhancements > div');
    enhancementItems.forEach(item => {
      const inputs = item.querySelectorAll('input, textarea');
      if (inputs.length >= 4) {
        data.enhancements.push({
          name: inputs[0].value || "",
          cost: inputs[1].value || "",
          item: inputs[2].value || "",
          effect: inputs[3].value || ""
        });
      }
    });

    // Collect masteries
    const masteryItems = document.querySelectorAll('#masteries > div');
    masteryItems.forEach(item => {
      const inputs = item.querySelectorAll('input');
      if (inputs.length >= 2) {
        data.masteries.push({
          name: inputs[0].value || "",
          effect: inputs[1].value || ""
        });
      }
    });

    // Collect mastery value
    data.masteryValue = document.getElementById("masteryValue").value || "";

    // Collect triggers
    const triggerItems = document.querySelectorAll('#triggers > div');
    triggerItems.forEach(trigger => {
      const nameInput = trigger.querySelector('input[placeholder="Trigger Name"]');
      const elementsContainer = trigger.querySelector('div[class*="space-y-2"]');
      const elements = [];
      
      if (elementsContainer) {
        const elementInputs = elementsContainer.querySelectorAll('input[placeholder="Element"]');
        elementInputs.forEach(input => {
          if (input.value.trim()) {
            elements.push(input.value.trim());
          }
        });
      }
      
      if (nameInput) {
        data.triggers.push({
          name: nameInput.value || "",
          elements: elements
        });
      }
    });

    // Collect mind alterations
    const mindAlterationItems = document.querySelectorAll('#mindAlterations > div');
    mindAlterationItems.forEach(item => {
      const inputs = item.querySelectorAll('input, textarea');
      if (inputs.length >= 2) {
        data.mindAlterations.push({
          name: inputs[0].value || "",
          desc: inputs[1].value || ""
        });
      }
    });

    // Collect mind breaks
    const mindBreakItems = document.querySelectorAll('#mindBreaks > div');
    mindBreakItems.forEach(item => {
      const inputs = item.querySelectorAll('input, textarea');
      if (inputs.length >= 2) {
        data.mindBreaks.push({
          name: inputs[0].value || "",
          desc: inputs[1].value || ""
        });
      }
    });

    // Convert to compact format and remove empty values
    const compactData = toCompactFormat(data);
    const exportString = JSON.stringify(compactData);
    showExportTextBox(exportString);
  }

  /** Show export data in a copyable text box */
  function showExportTextBox(exportString) {
    // Remove any existing export box
    const existingBox = document.getElementById('exportTextBox');
    if (existingBox) {
      existingBox.remove();
    }

    // Create the export text box
    const exportBox = document.createElement('div');
    exportBox.id = 'exportTextBox';
    exportBox.className = 'fixed top-4 right-4 w-96 max-h-96 bg-gray-900 border border-cyan-300/30 rounded-xl p-4 z-50 shadow-2xl';
    
    exportBox.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-cyan-300 font-semibold">Character Export Data</h3>
        <button id="closeExportBox" class="text-gray-400 hover:text-white transition-colors">×</button>
      </div>
      <textarea id="exportData" readonly class="w-full h-64 bg-gray-800 border border-gray-600 rounded p-2 text-xs font-mono text-white resize-none">${exportString}</textarea>
      <div class="mt-3 flex gap-2">
        <button id="copyExportData" class="px-3 py-1 bg-cyan-500/20 border border-cyan-300/30 rounded hover:bg-cyan-500/30 text-cyan-300 text-sm">Copy</button>
        <button id="closeExportBox2" class="px-3 py-1 bg-gray-500/20 border border-gray-300/30 rounded hover:bg-gray-500/30 text-gray-300 text-sm">Close</button>
      </div>
    `;

    document.body.appendChild(exportBox);

    // Add event listeners
    document.getElementById('closeExportBox').addEventListener('click', () => exportBox.remove());
    document.getElementById('closeExportBox2').addEventListener('click', () => exportBox.remove());
    document.getElementById('copyExportData').addEventListener('click', () => {
      const textarea = document.getElementById('exportData');
      textarea.select();
      document.execCommand('copy');
      // Show brief feedback
      const copyBtn = document.getElementById('copyExportData');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('bg-green-500/20', 'border-green-300/30', 'text-green-300');
      copyBtn.classList.remove('bg-cyan-500/20', 'border-cyan-300/30', 'text-cyan-300');
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.classList.remove('bg-green-500/20', 'border-green-300/30', 'text-green-300');
        copyBtn.classList.add('bg-cyan-500/20', 'border-cyan-300/30', 'text-cyan-300');
      }, 1000);
    });

    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        exportBox.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /** Show import dialog with text box */
  function showImportDialog() {
    // Remove any existing import box
    const existingBox = document.getElementById('importTextBox');
    if (existingBox) {
      existingBox.remove();
    }

    // Create the import dialog
    const importBox = document.createElement('div');
    importBox.id = 'importTextBox';
    importBox.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-gray-900 border border-cyan-300/30 rounded-xl p-4 z-50 shadow-2xl';
    
    importBox.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-cyan-300 font-semibold">Import Character Data</h3>
        <button id="closeImportBox" class="text-gray-400 hover:text-white transition-colors">×</button>
      </div>
      <p class="text-sm text-gray-300 mb-3">Paste your character data string below:</p>
      <textarea id="importData" placeholder="Paste character data here..." class="w-full h-40 bg-gray-800 border border-gray-600 rounded p-2 text-xs font-mono text-white resize-none"></textarea>
      <div class="mt-3 flex gap-2">
        <button id="importDataBtn" class="px-3 py-1 bg-cyan-500/20 border border-cyan-300/30 rounded hover:bg-cyan-500/30 text-cyan-300 text-sm">Import</button>
        <button id="closeImportBox2" class="px-3 py-1 bg-gray-500/20 border border-gray-300/30 rounded hover:bg-gray-500/30 text-gray-300 text-sm">Cancel</button>
      </div>
    `;

    document.body.appendChild(importBox);

    // Focus on textarea
    document.getElementById('importData').focus();

    // Add event listeners
    document.getElementById('closeImportBox').addEventListener('click', () => importBox.remove());
    document.getElementById('closeImportBox2').addEventListener('click', () => importBox.remove());
    document.getElementById('importDataBtn').addEventListener('click', async () => {
      const importString = document.getElementById('importData').value;
      if (importString) {
        importBox.remove();
        await importCharacterData(importString);
      }
    });

    // Import on Ctrl+Enter
    document.getElementById('importData').addEventListener('keydown', async (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        const importString = document.getElementById('importData').value;
        if (importString) {
          importBox.remove();
          await importCharacterData(importString);
        }
      }
    });

    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        importBox.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /** Import character data from a string */
  async function importCharacterData(importString) {

    try {
      let rawData = JSON.parse(importString);
      
      // Check if data is in compact format and convert if needed
      let data;
      if (isCompactFormat(rawData)) {
        data = fromCompactFormat(rawData);
      } else {
        data = rawData;
      }
      
      // Clear existing data first - ensure complete reset
      clearAllData();
      
      // Wait a moment for the reset to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Import basic info
      document.getElementById("charName").value = safeValue(data.name);
      document.getElementById("level").value = safeValue(data.level);
      document.getElementById("exp").value = safeValue(data.exp);
      document.getElementById("race").value = safeValue(data.race);

      // Import core attributes
      if (data.core) {
        const coreRows = document.querySelectorAll('#coreAttributes tr');
        data.core.forEach((attr, i) => {
          if (coreRows[i]) {
            const inputs = coreRows[i].querySelectorAll('input');
            if (inputs.length >= 5) {
              inputs[0].value = safeValue(attr.base);
              inputs[1].value = safeValue(attr.mod);
              inputs[2].value = safeValue(attr.temp);
              inputs[3].value = safeValue(attr.level);
              inputs[4].value = safeValue(attr.total);
            }
          }
        });
      }

      // Import calculated attributes
      if (data.calc) {
        const calcRows = document.querySelectorAll('#calcAttributes tr');
        data.calc.forEach((attr, i) => {
          const rowIndex = i * 2; // Main rows are at even indices
          if (calcRows[rowIndex]) {
            const inputs = calcRows[rowIndex].querySelectorAll('input');
            if (inputs.length >= 6) {
              inputs[0].value = safeValue(attr.base);
              inputs[1].value = safeValue(attr.mod);
              inputs[2].value = safeValue(attr.temp);
              inputs[3].value = safeValue(attr.attrCount, "0"); // Attribute count defaults to "0"
              inputs[4].value = safeValue(attr.mult);
              inputs[5].value = safeValue(attr.end);
            }
            const extraInput = calcRows[rowIndex].querySelector('td:nth-last-child(2) input');
            if (extraInput) {
              extraInput.value = safeValue(attr.extra);
            }
            
            // Import attribute multipliers
            if (attr.attrMultipliers && attr.attrMultipliers.length > 0) {
              // Trigger the updateAttrMultipliers function by setting the count
              const attrCountInput = inputs[3];
              attrCountInput.value = safeValue(attr.attrCount, "0");
              attrCountInput.dispatchEvent(new Event('input'));
              
              // Wait a moment for the UI to update, then populate the multipliers
              setTimeout(() => {
                const nextRow = calcRows[rowIndex + 1];
                if (nextRow) {
                  const attrMultipliersContainer = nextRow.querySelector('td div.mt-2');
                  if (attrMultipliersContainer) {
                    const multiplierGroups = attrMultipliersContainer.querySelectorAll('div.flex.gap-1');
                    attr.attrMultipliers.forEach((attrMult, multIndex) => {
                      if (multiplierGroups[multIndex]) {
                        const attrSelect = multiplierGroups[multIndex].querySelector('select');
                        const multInput = multiplierGroups[multIndex].querySelector('input[type="number"]');
                        if (attrSelect) attrSelect.value = safeValue(attrMult.attr);
                        if (multInput) multInput.value = safeValue(attrMult.mult);
                      }
                    });
                  }
                }
              }, 50);
            }
          }
        });
      }

      // Import inventory items
      if (data.inventory) {
        clearContainer('#inventory');
        data.inventory.forEach(item => {
          addInventoryItem();
          const lastItem = document.querySelector('#inventory > div:last-child');
          if (lastItem) {
            const inputs = lastItem.querySelectorAll('input, textarea');
            if (inputs.length >= 2) {
              inputs[0].value = item.name || "";
              inputs[1].value = item.desc || "";
              // Trigger auto-resize for textareas
              if (inputs[1].tagName === 'TEXTAREA') {
                inputs[1].dispatchEvent(new Event('input'));
              }
            }
          }
        });
      }

      // Import mote abilities
      const allUnknownAbilities = []; // Collect all unknown abilities across all motes
      if (data.motes) {
        data.motes.forEach((moteData, moteIndex) => {
          const moteNum = moteIndex + 1;
          const moteContainer = document.getElementById(`mote-${moteNum}`);
          if (moteContainer) {
            // Set mote selection first
            const moteSelect = moteContainer.querySelector('select');
            if (moteSelect) {
              moteSelect.value = moteData.mote || "";
            }
            
            // Clear existing abilities and add new ones
            setTimeout(() => {
              // Find the abilities wrapper div (it's the last div in the mote container)
              const abilitiesWrap = moteContainer.querySelector('div.mt-3');
              if (abilitiesWrap) {
                // Clear all existing ability cards
                abilitiesWrap.innerHTML = '';
                
                // Add each ability from the imported data as separate cards
                if (moteData.abilities && moteData.abilities.length > 0) {
                  // Add abilities one by one with small delays to ensure proper DOM structure
                  for (let i = 0; i < moteData.abilities.length; i++) {
                    setTimeout(() => {
                      addMoteAbility(abilitiesWrap, moteSelect);
                    }, i * 50); // Small delay between each ability
                  }
                  
                  // Wait for all abilities to be added, then populate them
                  setTimeout(() => {
                    const unknownAbilities = populateImportedAbilities(abilitiesWrap, moteSelect, moteData.abilities);
                    if (unknownAbilities && unknownAbilities.length > 0) {
                      allUnknownAbilities.push(...unknownAbilities);
                    }
                    
                    // Show warning if this is the last mote and we have unknown abilities
                    if (moteIndex === data.motes.length - 1 && allUnknownAbilities.length > 0) {
                      setTimeout(() => {
                        showUnknownAbilitiesWarning(allUnknownAbilities);
                      }, 200);
                    }
                  }, moteData.abilities.length * 50 + 100);
                } else {
                  // Add minimum required ability if none exist
                  addMoteAbility(abilitiesWrap, moteSelect);
                }
              }
            }, 100);
          }
        });
      }

      // Import enhancements
      if (data.enhancements) {
        clearContainer('#enhancements');
        data.enhancements.forEach(enhancement => {
          addEnhancement();
          const lastEnhancement = document.querySelector('#enhancements > div:last-child');
          if (lastEnhancement) {
            const inputs = lastEnhancement.querySelectorAll('input, textarea');
            if (inputs.length >= 4) {
              inputs[0].value = enhancement.name || "";
              inputs[1].value = enhancement.cost || "";
              inputs[2].value = enhancement.item || "";
              inputs[3].value = enhancement.effect || "";
              // Trigger auto-resize for textareas
              inputs.forEach(input => {
                if (input.tagName === 'TEXTAREA') {
                  input.dispatchEvent(new Event('input'));
                }
              });
            }
          }
        });
      }

      // Import masteries
      if (data.masteries) {
        clearContainer('#masteries');
        data.masteries.forEach(mastery => {
          addMastery();
          const lastMastery = document.querySelector('#masteries > div:last-child');
          if (lastMastery) {
            const inputs = lastMastery.querySelectorAll('input');
            if (inputs.length >= 2) {
              inputs[0].value = mastery.name || "";
              inputs[1].value = mastery.effect || "";
            }
          }
        });
      }

      // Import mastery value
      if (data.masteryValue !== undefined) {
        document.getElementById("masteryValue").value = safeValue(data.masteryValue);
      }

      // Import triggers
      if (data.triggers) {
        clearContainer('#triggers');
        data.triggers.forEach(trigger => {
          addTrigger();
          const lastTrigger = document.querySelector('#triggers > div:last-child');
          if (lastTrigger) {
            const nameInput = lastTrigger.querySelector('input[placeholder="Trigger Name"]');
            const elementsContainer = lastTrigger.querySelector('div[class*="space-y-2"]');
            
            if (nameInput) {
              nameInput.value = trigger.name || "";
            }
            
            if (elementsContainer && trigger.elements) {
              trigger.elements.forEach(element => {
                addTriggerElement(elementsContainer);
                const lastElement = elementsContainer.querySelector('div:last-child input');
                if (lastElement) {
                  lastElement.value = element;
                }
              });
            }
          }
        });
      }

      // Import mind alterations
      if (data.mindAlterations) {
        clearContainer('#mindAlterations');
        data.mindAlterations.forEach(alteration => {
          addMindAlteration();
          const lastAlteration = document.querySelector('#mindAlterations > div:last-child');
          if (lastAlteration) {
            const inputs = lastAlteration.querySelectorAll('input, textarea');
            if (inputs.length >= 2) {
              inputs[0].value = alteration.name || "";
              inputs[1].value = alteration.desc || "";
              // Trigger auto-resize for textareas
              inputs.forEach(input => {
                if (input.tagName === 'TEXTAREA') {
                  input.dispatchEvent(new Event('input'));
                }
              });
            }
          }
        });
      }

      // Import mind breaks
      if (data.mindBreaks) {
        clearContainer('#mindBreaks');
        data.mindBreaks.forEach(mindBreak => {
          addMindBreak();
          const lastMindBreak = document.querySelector('#mindBreaks > div:last-child');
          if (lastMindBreak) {
            const inputs = lastMindBreak.querySelectorAll('input, textarea');
            if (inputs.length >= 2) {
              inputs[0].value = mindBreak.name || "";
              inputs[1].value = mindBreak.desc || "";
              // Trigger auto-resize for textareas
              inputs.forEach(input => {
                if (input.tagName === 'TEXTAREA') {
                  input.dispatchEvent(new Event('input'));
                }
              });
            }
          }
        });
      }

      alert("Character imported successfully!");
      
    } catch (error) {
      alert("Error importing character data. Please check the format and try again.");
      console.error("Import error:", error);
    }
  }

  /** Clear all data from the character sheet */
  function clearAllData() {
    // Clear basic info
    document.getElementById("charName").value = "";
    document.getElementById("level").value = "";
    document.getElementById("exp").value = "";
    document.getElementById("race").value = "";
    
    // Clear all input fields
    document.querySelectorAll('input, textarea').forEach(input => {
      if (!input.readOnly) {
        input.value = "";
      }
    });
    
    // Clear dynamic containers
    clearContainer('#inventory');
    clearContainer('#enhancements');
    clearContainer('#masteries');
    clearContainer('#triggers');
    clearContainer('#mindAlterations');
    clearContainer('#mindBreaks');
    
    // Reset mote abilities - check all mote containers that exist
    for (let moteNum = 1; moteNum <= 10; moteNum++) { // Check up to 10 motes to be safe
      const moteContainer = document.getElementById(`mote-${moteNum}`);
      if (moteContainer) {
        // Clear abilities wrapper
        const abilitiesWrap = moteContainer.querySelector('div.mt-3');
        if (abilitiesWrap) {
          abilitiesWrap.innerHTML = '';
        }
        
        // Reset mote selection
        const moteSelect = moteContainer.querySelector('select');
        if (moteSelect) {
          moteSelect.value = "";
        }
        
        // Add back the minimum required ability
        if (abilitiesWrap) {
          addMoteAbility(abilitiesWrap, moteSelect);
        }
      } else {
        break; // Stop if we hit a non-existent mote container
      }
    }
  }

  /** Clear all children from a container */
  function clearContainer(selector) {
    const container = document.querySelector(selector);
    if (container) {
      container.innerHTML = "";
    }
  }

  /** Show warning dialog for abilities not found in database */
  function showUnknownAbilitiesWarning(unknownAbilities) {
    if (unknownAbilities.length === 0) return;
    
    // Create warning dialog
    const warningBox = document.createElement('div');
    warningBox.id = 'unknownAbilitiesWarning';
    warningBox.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-gray-900 border-2 border-yellow-500/50 rounded-xl p-4 z-50 shadow-2xl';
    
    let abilityList = unknownAbilities.map(ua => 
      `<li class="ml-4"><span class="text-cyan-300">${ua.mote}</span> → <span class="text-yellow-300">${ua.ability}</span></li>`
    ).join('');
    
    warningBox.innerHTML = `
      <div class="flex items-start gap-3 mb-3">
        <div class="text-yellow-500 text-2xl">⚠</div>
        <div>
          <h3 class="text-yellow-300 font-semibold text-lg">Unknown Abilities Detected</h3>
          <p class="text-sm text-gray-300 mt-1">The following abilities were not found in the database. They have been created with blank descriptions. Please verify and fill in the descriptions manually:</p>
        </div>
      </div>
      <ul class="text-sm text-white max-h-48 overflow-y-auto mb-4 bg-black/30 rounded p-2">
        ${abilityList}
      </ul>
      <div class="flex justify-end">
        <button id="closeUnknownAbilitiesWarning" class="px-4 py-2 bg-yellow-500/20 border border-yellow-300/30 rounded hover:bg-yellow-500/30 text-yellow-300 text-sm font-semibold">
          Understood
        </button>
      </div>
    `;
    
    document.body.appendChild(warningBox);
    
    // Add event listener to close button
    document.getElementById('closeUnknownAbilitiesWarning').addEventListener('click', () => {
      warningBox.remove();
    });
    
    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        warningBox.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /** Populate imported abilities with their data */
function populateImportedAbilities(abilitiesWrap, moteSelect, abilitiesData) {
    const list = abilitiesByMote[moteSelect.value] || [{"name": "", "desc": "", "details": ""}];
    const abilitySelects = abilitiesWrap.querySelectorAll("select");
    const abilityDescs = abilitiesWrap.querySelectorAll("textarea");
    const unknownAbilities = []; // Track abilities not found in database
    
    abilitySelects.forEach((sel, index) => {
      sel.innerHTML = "";
      list.forEach((ability) => {
        const op = document.createElement("option");
        op.value = ability.name;
        op.textContent = ability.name;
        op.dataset.desc = ability.desc;
        op.dataset.details = ability.details;
        sel.appendChild(op);
      });
      
      // Set the ability selection from imported data
      if (abilitiesData && abilitiesData[index]) {
        const importedAbility = abilitiesData[index];
        const abilityName = importedAbility.ability || "";
        
        // Check if the ability exists in the dropdown
        const abilityExistsInDropdown = Array.from(sel.options).some(opt => opt.value === abilityName);
        
        // If ability doesn't exist in dropdown, add it as a custom option
        if (abilityName && !abilityExistsInDropdown) {
          const customOption = document.createElement("option");
          customOption.value = abilityName;
          customOption.textContent = abilityName + " (Custom)";
          customOption.dataset.desc = "";
          customOption.dataset.details = "";
          sel.appendChild(customOption);
        }
        
        sel.value = abilityName;
        
        // Update description
        if (abilityDescs[index]) {
          let descToUse = importedAbility.desc || "";
          
          // If description is empty, try to look it up from the database
          if (!descToUse && abilityName) {
            // Find the ability in the database
            const foundAbility = list.find(a => a.name === abilityName);
            if (foundAbility) {
              // Found in database, use the database description
              descToUse = foundAbility.desc || "";
            } else {
              // Not found in database, warn the user
              unknownAbilities.push({
                mote: moteSelect.value || "Unknown Mote",
                ability: abilityName
              });
              descToUse = ""; // Leave blank for manual entry
            }
          }
          
          abilityDescs[index].value = descToUse;
          // Trigger auto-resize for textarea
          abilityDescs[index].dispatchEvent(new Event('input'));
        }
      }
      
      // Reset info button state
      const infoBtn = sel.parentElement.querySelector(".info-btn");
      if (infoBtn) {
        infoBtn.classList.remove("bg-cyan-500", "text-white");
        infoBtn.classList.add("bg-gray-600", "text-gray-300");
      }
    });
    
    // Update delete button visibility and validate selections
    updateDeleteButtons(abilitiesWrap);
    validateMoteSelections();
    validateAbilitySelections();
    
    // Return unknown abilities for warning display
    return unknownAbilities;
  }

  /** Validate mote selections to prevent duplicates */
  function validateMoteSelections() {
    const moteSelects = document.querySelectorAll('#mote-1 select, #mote-2 select, #mote-3 select');
    const selectedMotes = new Set();
    
    moteSelects.forEach(select => {
      const currentValue = select.value;
      const options = select.querySelectorAll('option');
      
      options.forEach(option => {
        if (option.value === '') {
          option.disabled = false;
          return;
        }
        
        // Disable if already selected by another mote
        if (selectedMotes.has(option.value) && option.value !== currentValue) {
          option.disabled = true;
          option.style.color = '#6b7280'; // Gray out
        } else {
          option.disabled = false;
          option.style.color = '';
        }
      });
      
      if (currentValue) {
        selectedMotes.add(currentValue);
      }
    });
  }

  /** Validate ability selections to prevent duplicates (except second to last) */
  function validateAbilitySelections() {
    const moteContainers = document.querySelectorAll('#mote-1, #mote-2, #mote-3');
    
    moteContainers.forEach(moteContainer => {
      const abilitySelects = moteContainer.querySelectorAll('.mt-3 select');
      const selectedAbilities = new Set();
      
      // First pass: collect all selected abilities
      abilitySelects.forEach(select => {
        if (select.value) {
          selectedAbilities.add(select.value);
        }
      });
      
      // Second pass: validate each select
      abilitySelects.forEach((select, index) => {
        const isSecondToLast = index === abilitySelects.length - 2;
        const options = select.querySelectorAll('option');
        
        options.forEach(option => {
          if (option.value === '') {
            option.disabled = false;
            return;
          }
          
          // Allow if it's the current selection or if it's second to last
          if (option.value === select.value || isSecondToLast) {
            option.disabled = false;
            option.style.color = '';
          } else if (selectedAbilities.has(option.value)) {
            // Check if this is a casting ability (contains 'casting' in the name)
            const isCastingAbility = option.value.toLowerCase().includes('casting');
            if (isCastingAbility) {
              // Allow casting abilities to be selected multiple times
              option.disabled = false;
              option.style.color = '';
            } else {
              // Disable if already selected by another ability (non-casting)
              option.disabled = true;
              option.style.color = '#6b7280'; // Gray out
            }
          } else {
            option.disabled = false;
            option.style.color = '';
          }
        });
      });
    });
  }


  // =============================
  // Dynamic UI Functions
  // =============================

  // Global variable to store the currently dragged element
  let draggedElement = null;

  /** Add drag handle to a card element */
  function addDragHandle(cardElement) {
    const dragHandle = el("div", "drag-handle");
    dragHandle.title = "Drag to reorder";
    
    // Make the card draggable
    cardElement.classList.add("draggable-card");
    cardElement.draggable = true;
    
    // Add drag event listeners
    cardElement.addEventListener('dragstart', handleDragStart);
    cardElement.addEventListener('dragend', handleDragEnd);
    cardElement.addEventListener('dragover', handleDragOver);
    cardElement.addEventListener('drop', handleDrop);
    
    // Insert drag handle as first child
    cardElement.insertBefore(dragHandle, cardElement.firstChild);
  }

  /** Handle drag start */
  function handleDragStart(e) {
    console.log('Drag start:', this.id);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
    e.dataTransfer.setData('text/plain', this.id);
    draggedElement = this; // Store reference to dragged element
  }

  /** Handle drag end */
  function handleDragEnd(e) {
    this.classList.remove('dragging');
    // Remove drag-over class from all cards
    document.querySelectorAll('.draggable-card').forEach(card => {
      card.classList.remove('drag-over');
    });
    draggedElement = null; // Clear dragged element reference
  }

  /** Handle drag over */
  function handleDragOver(e) {
    e.preventDefault();
    
    if (draggedElement) {
      // For mote abilities, check if they're in the same abilities container
      const draggedAbilitiesContainer = draggedElement.closest('[id$="-abilities"]');
      const dropAbilitiesContainer = this.closest('[id$="-abilities"]');
      
      // For other sections, check if they're in the same section-content
      const draggedSectionContainer = draggedElement.closest('.section-content');
      const dropSectionContainer = this.closest('.section-content');
      
      console.log('Drag over debug:');
      console.log('  draggedElement:', draggedElement.id);
      console.log('  draggedAbilitiesContainer:', draggedAbilitiesContainer ? draggedAbilitiesContainer.id : 'null');
      console.log('  dropAbilitiesContainer:', dropAbilitiesContainer ? dropAbilitiesContainer.id : 'null');
      console.log('  draggedSectionContainer:', draggedSectionContainer ? draggedSectionContainer.id : 'null');
      console.log('  dropSectionContainer:', dropSectionContainer ? dropSectionContainer.id : 'null');
      
      // Check if both elements are in the same container (either abilities or section)
      const sameContainer = (draggedAbilitiesContainer && dropAbilitiesContainer && draggedAbilitiesContainer === dropAbilitiesContainer) ||
                           (draggedSectionContainer && dropSectionContainer && draggedSectionContainer === dropSectionContainer);
      
      console.log('  sameContainer:', sameContainer);
      
      if (sameContainer) {
        e.dataTransfer.dropEffect = 'move';
        this.classList.add('drag-over');
      } else {
        e.dataTransfer.dropEffect = 'none';
        this.classList.remove('drag-over');
      }
    }
  }

  /** Handle drop */
  function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    console.log('Drop:', this.id, 'draggedElement:', draggedElement ? draggedElement.id : 'null');
    
    if (draggedElement && draggedElement !== this) {
      // For mote abilities, check if they're in the same abilities container
      const draggedAbilitiesContainer = draggedElement.closest('[id$="-abilities"]');
      const dropAbilitiesContainer = this.closest('[id$="-abilities"]');
      
      // For other sections, check if they're in the same section-content
      const draggedSectionContainer = draggedElement.closest('.section-content');
      const dropSectionContainer = this.closest('.section-content');
      
      console.log('Drop debug:');
      console.log('  draggedElement:', draggedElement.id);
      console.log('  draggedAbilitiesContainer:', draggedAbilitiesContainer ? draggedAbilitiesContainer.id : 'null');
      console.log('  dropAbilitiesContainer:', dropAbilitiesContainer ? dropAbilitiesContainer.id : 'null');
      console.log('  draggedSectionContainer:', draggedSectionContainer ? draggedSectionContainer.id : 'null');
      console.log('  dropSectionContainer:', dropSectionContainer ? dropSectionContainer.id : 'null');
      
      // Check if both elements are in the same container (either abilities or section)
      const sameContainer = (draggedAbilitiesContainer && dropAbilitiesContainer && draggedAbilitiesContainer === dropAbilitiesContainer) ||
                           (draggedSectionContainer && dropSectionContainer && draggedSectionContainer === dropSectionContainer);
      
      console.log('  sameContainer:', sameContainer);
      
      if (sameContainer) {
        const container = this.parentNode;
        const afterElement = getDragAfterElement(container, e.clientY);
        
        console.log('Moving element to container:', container.id, 'after:', afterElement ? afterElement.id : 'end');
        
        if (afterElement == null) {
          container.appendChild(draggedElement);
        } else {
          container.insertBefore(draggedElement, afterElement);
        }
      }
    }
  }

  /** Get the element after which to insert the dragged element */
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  
  /** Add a new mind break card when user clicks the button. */
    function addMindBreak() {
        const mindBreaks = document.getElementById("mindBreaks");
        const newCard = document.createElement("div");
    newCard.className = "p-3 rounded-xl border border-white/10 bg-white/5 relative";
    newCard.id = `mindbreak-${Date.now()}`;
    
    // Create delete button (only if there's more than one mind break)
    const deleteBtn = el("button", "absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 border border-red-300/30 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-colors");
    deleteBtn.innerHTML = "×";
    deleteBtn.title = "Delete mind break";
    deleteBtn.onclick = () => {
      // Only allow deletion if there's more than one mind break
      if (mindBreaks.children.length > 1) {
        newCard.remove();
        updateMindBreakDeleteButtons();
      }
    };
    
    // Create form fields
    const name = input({ placeholder: "Name", className: "w-full mb-2 pr-8" });
        const desc = textarea({ placeholder: "Description", rows: 3 });
    
    // Assemble the card
    newCard.appendChild(deleteBtn);
        newCard.appendChild(name);
        newCard.appendChild(desc);
        mindBreaks.appendChild(newCard);
    
    // Add drag handle
    addDragHandle(newCard);
    
    // Update delete button visibility
    updateMindBreakDeleteButtons();
  }

  /** Update mind break delete button visibility based on number of mind breaks. */
  function updateMindBreakDeleteButtons() {
    const mindBreaks = document.getElementById("mindBreaks");
    const mindBreakCards = mindBreaks.querySelectorAll("div");
    mindBreakCards.forEach((card) => {
      const deleteBtn = card.querySelector("button");
      if (deleteBtn) {
        // Hide delete button if this is the only mind break
        deleteBtn.style.display = mindBreakCards.length > 1 ? "flex" : "none";
      }
    });
  }

  /** Add a new inventory item when user clicks the button. */
  function addInventoryItem() {
    const inventory = document.getElementById("inventory");
    const newItem = document.createElement("div");
    newItem.className = "p-3 rounded-xl border border-white/10 bg-white/5 relative";
    newItem.id = `inventory-${Date.now()}`;
    
    // Create delete button
    const deleteBtn = el("button", "absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 border border-red-300/30 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-colors");
    deleteBtn.innerHTML = "×";
    deleteBtn.title = "Delete item";
    deleteBtn.onclick = () => newItem.remove();
    
    // Create form fields
    const name = input({ placeholder: "Item Name", className: "w-full mb-2 pr-8" });
    const desc = textarea({ placeholder: "Description", rows: 2 });
    
    // Assemble the item
    newItem.appendChild(deleteBtn);
    newItem.appendChild(name);
    newItem.appendChild(desc);
    inventory.appendChild(newItem);
    
    // Add drag handle
    addDragHandle(newItem);
  }

  /** Add a new mind alteration item when user clicks the button. */
  function addMindAlteration() {
    const mindAlterations = document.getElementById("mindAlterations");
    const newItem = document.createElement("div");
    newItem.className = "p-3 rounded-xl border border-white/10 bg-white/5 relative";
    
    // Create delete button
    const deleteBtn = el("button", "absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 border border-red-300/30 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-colors");
    deleteBtn.innerHTML = "×";
    deleteBtn.title = "Delete mind alteration";
    deleteBtn.onclick = () => newItem.remove();
    
    // Create form fields
    const name = input({ placeholder: "Name", className: "w-full mb-2 pr-8" });
    const desc = textarea({ placeholder: "Description", rows: 2 });
    
    // Assemble the item
    newItem.appendChild(deleteBtn);
    newItem.appendChild(name);
    newItem.appendChild(desc);
    mindAlterations.appendChild(newItem);
  }

  // Make functions available globally
  window.addMindBreak = addMindBreak;
  window.addInventoryItem = addInventoryItem;
  window.addEnhancement = addEnhancement;
  window.addMastery = addMastery;
  window.addMindAlteration = addMindAlteration;
  window.addTrigger = addTrigger;

  // =============================
  // Initialize the page
  // =============================
  
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize abilities data first
    initializeAbilitiesData();
    
    // Build all the dynamic sections
    buildCoreAttributes(document.getElementById("coreAttributes"));
    buildCalculatedAttributes(document.getElementById("calcAttributes"));
    buildMote(document.getElementById("mote-1"));
    buildMote(document.getElementById("mote-2"));
    buildMote(document.getElementById("mote-3"));
    buildEnhancements(document.getElementById("enhancements"));
    buildMasteries(document.getElementById("masteries"));
    buildMindAlterations(document.getElementById("mindAlterations"));
    buildMindBreaks(document.getElementById("mindBreaks"));
    
    // Wire up export/import buttons
    document.getElementById('exportBtn').addEventListener('click', exportCharacter);
    document.getElementById('importBtn').addEventListener('click', showImportDialog);
    
    // Initialize validation
    validateMoteSelections();
    validateAbilitySelections();
  });
  
})();
