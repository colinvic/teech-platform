-- ============================================================
-- teech-platform Migration 002: Curriculum (ACARA v9)
-- ============================================================
-- Maps to Australian Curriculum Version 9 structure:
-- Learning Area → Subject → Strand → Section → Content Cards
-- ============================================================

create type section_status as enum (
  'locked', 'available', 'in_progress', 'passed', 'mastered'
);

create type card_type as enum (
  'text', 'image', 'diagram', 'video', 'interactive'
);

-- ── CURRICULUM SUBJECTS ────────────────────────────────────────────────────────
-- One row per Learning Area + Year Level combination
-- e.g. "Science — Year 9"

create table curriculum_subjects (
  id              uuid primary key default gen_random_uuid(),
  learning_area   text not null check (learning_area in (
    'english', 'mathematics', 'science', 'humanities_social_sciences',
    'technologies', 'health_pe', 'arts', 'languages'
  )),
  year_level      year_level not null,
  name            text not null,
  acara_code      text not null,
  description     text not null,
  is_active       boolean not null default false,
  created_at      timestamptz not null default now(),
  constraint curriculum_subjects_unique unique (learning_area, year_level)
);

comment on table curriculum_subjects is 'ACARA v9 subjects. One per Learning Area + Year Level. is_active controls student visibility.';

-- Seed: Year 9 Science (MVP)
insert into curriculum_subjects (learning_area, year_level, name, acara_code, description, is_active)
values (
  'science', 'year_9',
  'Science — Year 9',
  'ACSSC906',
  'Year 9 Science covers biological sciences, chemical sciences, physical sciences, and Earth and space sciences, developing students'' understanding of scientific concepts and inquiry skills.',
  true
);

-- ── CURRICULUM SECTIONS ────────────────────────────────────────────────────────
-- Each section = one discrete learning unit = one "app" in the platform

create table curriculum_sections (
  id                      uuid primary key default gen_random_uuid(),
  subject_id              uuid not null references curriculum_subjects(id) on delete cascade,
  strand                  text not null,
  name                    text not null,
  slug                    text not null unique,
  acara_descriptor_code   text not null,
  acara_descriptor_text   text not null,
  description             text not null,
  estimated_duration_minutes int not null default 20 check (estimated_duration_minutes between 5 and 60),
  order_in_subject        int not null,
  is_active               boolean not null default false,
  created_at              timestamptz not null default now()
);

comment on table curriculum_sections is 'Each section maps to exactly one ACARA content descriptor. One section = one pass badge.';
comment on column curriculum_sections.slug is 'URL-safe identifier e.g. year-9-science-cell-biology. Must be unique across platform.';

-- ── SEED: Year 9 Science sections (MVP — 16 sections across 4 strands) ─────────

-- Biological Sciences (4 sections)
with subject as (select id from curriculum_subjects where learning_area = 'science' and year_level = 'year_9')
insert into curriculum_sections (subject_id, strand, name, slug, acara_descriptor_code, acara_descriptor_text, description, estimated_duration_minutes, order_in_subject, is_active)
values
  ((select id from subject), 'biological_sciences',
   'Multicellular Organisms', 'y9-sci-multicellular-organisms',
   'ACSSU175',
   'Multicellular organisms contain systems of organs that carry out specialised functions that enable them to survive and reproduce.',
   'Explore how organ systems work together in multicellular organisms. Learn about specialised cells, tissues, and organs.',
   25, 1, true),

  ((select id from subject), 'biological_sciences',
   'Cell Reproduction', 'y9-sci-cell-reproduction',
   'ACSSU184',
   'Ecosystems consist of communities of interdependent organisms and abiotic components of the environment; matter and energy flow through these systems.',
   'Understand how cells divide and reproduce through mitosis and meiosis.',
   25, 2, true),

  ((select id from subject), 'biological_sciences',
   'Genetics & Heredity', 'y9-sci-genetics-heredity',
   'ACSSU185',
   'Inheritance of genetic information in organisms.',
   'Discover how genetic information is passed from one generation to the next.',
   30, 3, true),

  ((select id from subject), 'biological_sciences',
   'Evolution & Natural Selection', 'y9-sci-evolution',
   'ACSSU186',
   'The theory of evolution by natural selection explains the diversity of living things and is supported by a range of scientific evidence.',
   'Explore how natural selection drives evolution and the evidence that supports evolutionary theory.',
   30, 4, true),

  -- Chemical Sciences (4 sections)
  ((select id from subject), 'chemical_sciences',
   'Chemical Reactions', 'y9-sci-chemical-reactions',
   'ACSSU178',
   'Chemical reactions involve rearranging atoms to form new substances; during a chemical reaction mass is not created or destroyed.',
   'Learn about conservation of mass, reaction types, and how to represent chemical reactions.',
   25, 5, true),

  ((select id from subject), 'chemical_sciences',
   'Acids & Bases', 'y9-sci-acids-bases',
   'ACSSU187',
   'All matter is made of atoms that are composed of protons, neutrons, and electrons; natural radioactivity arises from the decay of nuclei in atoms.',
   'Understand the pH scale, properties of acids and bases, and neutralisation reactions.',
   20, 6, true),

  ((select id from subject), 'chemical_sciences',
   'The Periodic Table', 'y9-sci-periodic-table',
   'ACSSU186',
   'The atomic structure and properties of elements.',
   'Explore how the periodic table is organised and how to predict element properties from their position.',
   25, 7, true),

  ((select id from subject), 'chemical_sciences',
   'Energy in Chemical Reactions', 'y9-sci-energy-reactions',
   'ACSSU180',
   'Energy transformations in chemical reactions.',
   'Understand exothermic and endothermic reactions and energy changes in chemical processes.',
   20, 8, true),

  -- Physical Sciences (4 sections)
  ((select id from subject), 'physical_sciences',
   'Motion & Forces', 'y9-sci-motion-forces',
   'ACSSU229',
   'The relationship between force, mass, and acceleration; Newton''s laws of motion.',
   'Apply Newton''s Laws to explain and predict the motion of objects.',
   30, 9, true),

  ((select id from subject), 'physical_sciences',
   'Energy Transfer', 'y9-sci-energy-transfer',
   'ACSSU182',
   'Energy transfer through different mediums — conduction, convection, radiation.',
   'Explore how energy moves through matter and the electromagnetic spectrum.',
   25, 10, true),

  ((select id from subject), 'physical_sciences',
   'Electricity & Circuits', 'y9-sci-electricity',
   'ACSSU183',
   'The relationship between voltage, current, and resistance in electric circuits.',
   'Understand how electric circuits work and apply Ohm''s Law.',
   25, 11, true),

  ((select id from subject), 'physical_sciences',
   'Waves & Sound', 'y9-sci-waves-sound',
   'ACSSU190',
   'Wave properties and the behaviour of sound and light.',
   'Explore the properties of waves, including sound and light, and how they interact with matter.',
   20, 12, true),

  -- Earth & Space Sciences (4 sections)
  ((select id from subject), 'earth_space_sciences',
   'The Solar System', 'y9-sci-solar-system',
   'ACSSU188',
   'The universe contains billions of galaxies, each containing billions of stars, with properties and movements explained by physical laws.',
   'Explore the structure of our solar system, planetary motion, and the scale of the universe.',
   25, 13, true),

  ((select id from subject), 'earth_space_sciences',
   'Earth''s Structure', 'y9-sci-earth-structure',
   'ACSSU180',
   'The structure and composition of Earth''s layers.',
   'Understand Earth''s internal structure and the evidence scientists use to study it.',
   20, 14, true),

  ((select id from subject), 'earth_space_sciences',
   'Plate Tectonics', 'y9-sci-plate-tectonics',
   'ACSSU180',
   'Tectonic plates move and interact to cause geological events.',
   'Explore how plate movement causes earthquakes, volcanoes, and mountain building.',
   25, 15, true),

  ((select id from subject), 'earth_space_sciences',
   'Climate & Weather Systems', 'y9-sci-climate-weather',
   'ACSSU189',
   'Global systems, including the carbon cycle, involve interactions among the lithosphere, biosphere, hydrosphere, and atmosphere.',
   'Understand how Earth''s systems interact to create weather patterns and drive climate.',
   25, 16, true);

-- ── SECTION CONTENT CARDS ──────────────────────────────────────────────────────

create table section_cards (
  id                    uuid primary key default gen_random_uuid(),
  section_id            uuid not null references curriculum_sections(id) on delete cascade,
  card_type             card_type not null default 'text',
  title                 text not null,
  content               text not null,         -- Markdown
  media_url             text,
  alt_text              text,                   -- Required when media_url is set — accessibility
  order_in_section      int not null,
  reading_time_seconds  int not null default 60,
  created_at            timestamptz not null default now(),
  constraint section_cards_alt_text_check check (
    (media_url is null) or (alt_text is not null and char_length(alt_text) > 0)
  )
);

comment on table section_cards is 'Content cards for each section. Alt text is mandatory when media is present — accessibility principle.';
comment on column section_cards.alt_text is 'REQUIRED when media_url is set. Accessibility is non-negotiable.';

-- ── RLS ────────────────────────────────────────────────────────────────────────

alter table curriculum_subjects enable row level security;
alter table curriculum_sections enable row level security;
alter table section_cards enable row level security;

-- Curriculum is readable by all authenticated users
create policy "curriculum_subjects_select"
  on curriculum_subjects for select
  to authenticated
  using (is_active = true);

create policy "curriculum_sections_select"
  on curriculum_sections for select
  to authenticated
  using (is_active = true);

create policy "section_cards_select"
  on section_cards for select
  to authenticated
  using (
    exists (
      select 1 from curriculum_sections
      where curriculum_sections.id = section_cards.section_id
      and curriculum_sections.is_active = true
    )
  );

-- ── INDEXES ────────────────────────────────────────────────────────────────────

create index idx_curriculum_subjects_learning_area on curriculum_subjects(learning_area);
create index idx_curriculum_subjects_year_level on curriculum_subjects(year_level);
create index idx_curriculum_sections_subject_id on curriculum_sections(subject_id);
create index idx_curriculum_sections_strand on curriculum_sections(strand);
create index idx_curriculum_sections_slug on curriculum_sections(slug);
create index idx_section_cards_section_id on section_cards(section_id, order_in_section);

-- ── SEED: Year 9 Science — Content Cards (MVP) ───────────────────────────────
-- Seeding 2 content cards per section as the foundation.
-- Additional cards are added via the admin content management interface.
-- Each card is factual, gender-neutral, and ACARA v9 aligned.

do $$
declare
  v_section_id uuid;
begin

  -- ── BIOLOGICAL SCIENCES ───────────────────────────────────────────────────

  -- Multicellular Organisms
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-multicellular-organisms';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'What is a multicellular organism?',
  'A multicellular organism is a living thing made up of more than one cell. Humans, animals, plants, and most fungi are multicellular organisms.

Unlike single-celled organisms that carry out all life functions in one cell, multicellular organisms divide the work. Groups of similar cells form **tissues**, tissues form **organs**, and organs work together in **organ systems**.

For example:
- Muscle cells → muscle tissue → heart (organ) → circulatory system
- Nerve cells → nervous tissue → brain (organ) → nervous system

This specialisation allows multicellular organisms to be far more complex than single-celled life.',
  1, 90),
  (v_section_id, 'text', 'Levels of organisation',
  'Multicellular organisms are organised into a hierarchy from smallest to most complex:

**Cell** → the basic unit of life. Each cell has a specific job.

**Tissue** → a group of similar cells working together. Example: cardiac muscle tissue in the heart.

**Organ** → a structure made of two or more tissue types that performs a specific function. Example: the stomach contains muscle tissue, epithelial tissue, and connective tissue.

**Organ system** → a group of organs that work together. Example: the digestive system includes the mouth, oesophagus, stomach, intestines, liver, and pancreas.

**Organism** → the complete living thing, made up of all its organ systems working together.',
  2, 80);

  -- Cell Reproduction
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-cell-reproduction';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'Why do cells divide?',
  'Cells divide for three main reasons:
1. **Growth** — organisms grow by producing more cells, not by making cells bigger.
2. **Repair** — damaged or worn-out cells are replaced by new ones.
3. **Reproduction** — some organisms reproduce by cell division.

There are two types of cell division:
- **Mitosis** produces two genetically identical daughter cells. It is used for growth and repair.
- **Meiosis** produces four genetically unique cells with half the usual number of chromosomes. It is used to produce sex cells (sperm and eggs).',
  1, 75),
  (v_section_id, 'text', 'Mitosis — step by step',
  'Mitosis has four main phases:

**Prophase** — chromosomes condense and become visible. The nuclear envelope breaks down.

**Metaphase** — chromosomes line up along the centre of the cell.

**Anaphase** — chromosomes are pulled to opposite ends of the cell.

**Telophase** — two new nuclei form, one at each end of the cell.

After mitosis, the cell divides in two (cytokinesis), producing two identical daughter cells each with the same number of chromosomes as the original.

A useful memory aid: **PMAT** (Prophase, Metaphase, Anaphase, Telophase).',
  2, 85);

  -- Genetics and Heredity
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-genetics-heredity';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'DNA, genes, and chromosomes',
  'Genetic information is stored in **DNA** (deoxyribonucleic acid), a molecule shaped like a twisted ladder (double helix).

A **gene** is a section of DNA that contains the instructions for making a specific protein. Proteins determine the traits (characteristics) of an organism.

Genes are located on **chromosomes** — structures found in the nucleus of every cell. Humans have 46 chromosomes (23 pairs). One chromosome from each pair was inherited from each biological parent.

The complete set of genetic information in an organism is called its **genome**.',
  1, 80),
  (v_section_id, 'text', 'Dominant and recessive alleles',
  'Each gene can have different versions called **alleles**. For example, the gene for eye colour has alleles for brown, blue, and other colours.

- A **dominant** allele (written with a capital letter, e.g. B) is expressed when at least one copy is present.
- A **recessive** allele (written with a lowercase letter, e.g. b) is only expressed when two copies are present.

A person who has two identical alleles (BB or bb) is **homozygous**.
A person who has two different alleles (Bb) is **heterozygous**.

The combination of alleles a person has is called their **genotype**.
The physical characteristic that results is called their **phenotype**.',
  2, 90);

  -- Evolution
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-evolution';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'Natural selection — the mechanism of evolution',
  'Charles Darwin proposed that evolution occurs through **natural selection**. The process works in four steps:

1. **Variation** — individuals in a population vary in their traits (e.g. some are faster, some have thicker fur).
2. **Inheritance** — many of these traits are heritable (passed from parent to offspring).
3. **Competition** — more offspring are produced than can survive given limited resources.
4. **Differential survival** — individuals with traits that help them survive and reproduce are more likely to pass those traits on.

Over many generations, advantageous traits become more common in the population. This gradual change is **evolution**.',
  1, 90),
  (v_section_id, 'text', 'Evidence for evolution',
  'Multiple lines of scientific evidence support the theory of evolution:

**Fossil record** — fossils show how organisms changed over time. Transitional fossils show intermediate forms between ancestral and modern species.

**Comparative anatomy** — similar bone structures in different species (e.g. the arm of a human, the wing of a bat, and the flipper of a whale) suggest common ancestry.

**DNA evidence** — species that share recent common ancestors have more similar DNA sequences. Scientists can estimate how closely related species are by comparing their genomes.

**Direct observation** — natural selection has been observed directly, particularly in bacteria developing antibiotic resistance.',
  2, 85);

  -- ── CHEMICAL SCIENCES ─────────────────────────────────────────────────────

  -- Chemical Reactions
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-chemical-reactions';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'What is a chemical reaction?',
  'A **chemical reaction** occurs when substances (reactants) are transformed into new substances (products) with different properties.

During a reaction, atoms are **rearranged** — old bonds between atoms are broken and new bonds form. The atoms themselves are not created or destroyed.

This is the **Law of Conservation of Mass**: the total mass of reactants equals the total mass of products.

Chemical reactions are represented by **equations**:
> Reactants → Products
> 2H₂ + O₂ → 2H₂O

Signs that a chemical reaction has occurred include: colour change, gas production, temperature change, precipitate formation, and light emission.',
  1, 80),
  (v_section_id, 'text', 'Types of chemical reactions',
  'The main types of chemical reactions are:

**Synthesis** — two or more substances combine to form one new substance.
> A + B → AB

**Decomposition** — one substance breaks down into two or more simpler substances.
> AB → A + B

**Combustion** — a substance reacts rapidly with oxygen, releasing heat and light. Products are usually carbon dioxide and water.
> Fuel + O₂ → CO₂ + H₂O

**Precipitation** — two solutions react to form an insoluble solid (precipitate).

**Acid-base neutralisation** — an acid and a base react to form a salt and water.',
  2, 85);

  -- Acids and Bases
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-acids-bases';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'The pH scale',
  'The **pH scale** measures how acidic or alkaline (basic) a solution is. It runs from 0 to 14:

- **pH 0–6**: Acidic (the lower the pH, the stronger the acid)
- **pH 7**: Neutral (pure water)
- **pH 8–14**: Alkaline/Basic (the higher the pH, the stronger the base)

**Acids** release hydrogen ions (H⁺) in water. Examples: hydrochloric acid (pH ~1), lemon juice (pH ~2), vinegar (pH ~3).

**Bases** release hydroxide ions (OH⁻) in water. Examples: bleach (pH ~13), oven cleaner (pH ~14), baking soda solution (pH ~9).

**Indicators** are substances that change colour depending on pH. Litmus paper turns red in acid and blue in alkali.',
  1, 80),
  (v_section_id, 'text', 'Neutralisation reactions',
  'When an acid and a base react, they **neutralise** each other, producing a **salt** and **water**.

> Acid + Base → Salt + Water

For example:
> Hydrochloric acid + Sodium hydroxide → Sodium chloride + Water
> HCl + NaOH → NaCl + H₂O

The salt produced depends on the acid and base used. Sodium chloride (table salt) is produced from hydrochloric acid and sodium hydroxide.

Neutralisation is used in many practical applications:
- Antacids neutralise excess stomach acid to relieve indigestion
- Agricultural lime (calcium carbonate) neutralises acidic soil
- Toothpaste (slightly basic) neutralises mouth acids from bacteria',
  2, 85);

  -- Periodic Table
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-periodic-table';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'Organisation of the periodic table',
  'The **periodic table** arranges all known elements by their atomic number (number of protons) and groups them by similar properties.

**Periods** (rows) run left to right. Elements in the same period have the same number of electron shells.

**Groups** (columns) run top to bottom. Elements in the same group have the same number of electrons in their outer shell, giving them similar chemical properties.

Key groups:
- **Group 1** — Alkali metals (very reactive, e.g. sodium, potassium)
- **Group 17** — Halogens (reactive non-metals, e.g. fluorine, chlorine)
- **Group 18** — Noble gases (very unreactive, e.g. helium, argon)',
  1, 80),
  (v_section_id, 'text', 'Reading an element''s entry',
  'Each element in the periodic table is represented by a symbol box containing key information:

**Atomic number** (top) — the number of protons in the nucleus. This is unique to each element and defines what the element is.

**Symbol** (middle) — one or two letters representing the element (e.g. C for carbon, Na for sodium, from the Latin "natrium").

**Atomic mass** (bottom) — the average mass of the element''s atoms, measured in atomic mass units (amu).

For a neutral atom:
- Number of **protons** = atomic number
- Number of **electrons** = atomic number
- Number of **neutrons** = atomic mass − atomic number (approximately)',
  2, 80);

  -- Energy in Chemical Reactions
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-energy-reactions';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'Exothermic and endothermic reactions',
  'All chemical reactions involve energy changes. Energy is stored in chemical bonds.

**Exothermic reactions** release energy (usually as heat) to the surroundings. Breaking bonds in reactants releases less energy than forming new bonds in products.
- Examples: combustion (burning), neutralisation, respiration
- The surroundings get warmer

**Endothermic reactions** absorb energy from the surroundings. More energy is needed to break bonds in reactants than is released when forming products.
- Examples: photosynthesis, dissolving ammonium nitrate in water, thermal decomposition
- The surroundings get cooler',
  1, 80),
  (v_section_id, 'text', 'Activation energy',
  '**Activation energy** is the minimum amount of energy required to start a chemical reaction. Even exothermic reactions need a "push" to get started.

Think of it like a ball on a hill: you need to push it over the top (activation energy) before it rolls down and releases energy.

**Catalysts** are substances that lower the activation energy of a reaction, making it easier to start and faster, without being used up themselves.

Examples of catalysts:
- Enzymes in the body (biological catalysts) speed up reactions like digestion
- Platinum in catalytic converters helps convert exhaust gases
- Manganese dioxide speeds up the decomposition of hydrogen peroxide

Catalysts do not change the overall energy released or absorbed by a reaction.',
  2, 85);

  -- ── PHYSICAL SCIENCES ─────────────────────────────────────────────────────

  -- Motion and Forces
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-motion-forces';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'Newton''s Three Laws of Motion',
  '**Newton''s First Law (Inertia)**
An object at rest stays at rest, and an object in motion stays in motion at the same speed and direction, unless acted on by an unbalanced force.

**Newton''s Second Law (F = ma)**
The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.
> Force (N) = Mass (kg) × Acceleration (m/s²)

**Newton''s Third Law (Action-Reaction)**
For every action, there is an equal and opposite reaction. Forces always come in pairs.
Example: a rocket pushes exhaust gases downward; the gases push the rocket upward.',
  1, 90),
  (v_section_id, 'text', 'Speed, velocity, and acceleration',
  '**Speed** is how fast an object is moving — the distance covered per unit of time.
> Speed = Distance ÷ Time (m/s)

**Velocity** is speed in a specific direction. It is a vector quantity (has both magnitude and direction).
> A car travelling at 60 km/h north has a velocity of 60 km/h north.

**Acceleration** is the rate of change of velocity — how quickly velocity changes over time.
> Acceleration = Change in velocity ÷ Time (m/s²)

Acceleration can be positive (speeding up), negative (slowing down — also called deceleration), or it can involve a change in direction without a change in speed (e.g. circular motion).',
  2, 80);

  -- Energy Transfer
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-energy-transfer';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'How heat energy is transferred',
  'Heat is thermal energy that flows from warmer objects to cooler objects. There are three mechanisms:

**Conduction** — heat transfers through direct contact between particles. Particles vibrate and pass energy to neighbouring particles. Best in solids, especially metals. Example: a metal spoon in hot soup gets warm.

**Convection** — heat transfers through the movement of fluids (liquids and gases). Warm fluid rises (less dense), cool fluid sinks (more dense), creating convection currents. Example: hot air rising in a room, ocean currents.

**Radiation** — heat transfers as electromagnetic waves (infrared radiation) without needing a medium. Can travel through a vacuum. Example: warmth from the Sun, heat from a fire.',
  1, 85),
  (v_section_id, 'text', 'The electromagnetic spectrum',
  'The **electromagnetic spectrum** is the range of all types of electromagnetic radiation, ordered by wavelength (and frequency):

| Type | Wavelength | Uses |
|------|-----------|------|
| Radio waves | Longest | Broadcasting, communications |
| Microwaves | | Cooking, mobile phones |
| Infrared | | Thermal imaging, remote controls |
| **Visible light** | | Human vision |
| Ultraviolet | | Sterilisation, vitamin D production |
| X-rays | | Medical imaging |
| Gamma rays | Shortest | Cancer treatment, sterilisation |

All electromagnetic waves travel at the speed of light in a vacuum (3 × 10⁸ m/s) and do not require a medium.',
  2, 90);

  -- Electricity and Circuits
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-electricity';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'Current, voltage, and resistance',
  'Three key quantities describe electric circuits:

**Current (I)** — the flow of electric charge (electrons) through a conductor. Measured in **amperes (A)**. Current flows from the negative terminal to the positive terminal of a battery (conventional current flows positive to negative).

**Voltage (V)** — the "push" or potential difference that drives current through a circuit. Measured in **volts (V)**. A higher voltage drives more current.

**Resistance (R)** — the opposition to the flow of current. Measured in **ohms (Ω)**. Longer, thinner wires have greater resistance.

**Ohm''s Law** relates all three:
> V = I × R
> Voltage = Current × Resistance',
  1, 85),
  (v_section_id, 'text', 'Series and parallel circuits',
  'Components in a circuit can be connected in two ways:

**Series circuit** — components connected in a single loop.
- The same current flows through every component
- Voltage is shared across components
- If one component fails, the whole circuit breaks

**Parallel circuit** — components connected in separate branches.
- Current splits between branches
- Each component receives the full supply voltage
- If one component fails, others continue to work

Most household circuits are wired in parallel so that each appliance receives the full mains voltage (240 V in Australia) and can be switched independently.',
  2, 85);

  -- Waves and Sound
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-waves-sound';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'Properties of waves',
  'A **wave** is a transfer of energy through matter or space without permanently moving matter.

Key wave properties:
- **Wavelength (λ)** — the distance from one crest to the next. Measured in metres (m).
- **Frequency (f)** — the number of complete waves passing a point per second. Measured in hertz (Hz).
- **Amplitude** — the maximum displacement from the rest position. Determines the energy and loudness (for sound) or brightness (for light).
- **Wave speed (v)** — how fast the wave moves through the medium.

Wave speed, frequency, and wavelength are related:
> v = f × λ',
  1, 80),
  (v_section_id, 'text', 'Sound waves',
  '**Sound** is a longitudinal wave — particles vibrate parallel to the direction of travel, creating compressions and rarefactions.

Sound requires a **medium** (solid, liquid, or gas) to travel. It cannot travel through a vacuum (unlike electromagnetic waves).

Sound travels fastest through solids and slowest through gases. In air at room temperature, sound travels at approximately 340 m/s.

Key properties:
- **Pitch** is determined by frequency (higher frequency = higher pitch)
- **Loudness** is determined by amplitude (larger amplitude = louder)
- **Echoes** are reflections of sound waves
- **Ultrasound** (frequency above 20 000 Hz) is used in medical imaging',
  2, 80);

  -- ── EARTH AND SPACE SCIENCES ──────────────────────────────────────────────

  -- Solar System
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-solar-system';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'Structure of the solar system',
  'Our **solar system** consists of the Sun and everything bound to it by gravity. In order from the Sun:

**Terrestrial (rocky) planets**: Mercury, Venus, Earth, Mars — small, dense, rocky.

**Gas giants**: Jupiter, Saturn — massive, composed mainly of hydrogen and helium.

**Ice giants**: Uranus, Neptune — composed mainly of water, ammonia, and methane ices.

Also in the solar system:
- **Asteroid belt** — between Mars and Jupiter
- **Dwarf planets** — including Pluto
- **Comets** — icy bodies with highly elliptical orbits
- **Moons** — natural satellites orbiting planets

The solar system is located in the **Milky Way galaxy**, about 26 000 light-years from the galactic centre.',
  1, 85),
  (v_section_id, 'text', 'Scale of the universe',
  'The scale of the universe is difficult to comprehend. Some useful reference points:

- **Earth–Moon distance**: ~384 000 km
- **Earth–Sun distance**: ~150 million km (1 astronomical unit, or AU)
- **Light-year**: the distance light travels in one year ≈ 9.46 × 10¹² km
- **Nearest star (Proxima Centauri)**: 4.2 light-years from Earth
- **Milky Way galaxy**: ~100 000 light-years across, containing ~200–400 billion stars
- **Observable universe**: ~93 billion light-years in diameter, containing billions of galaxies

Light from the Sun takes about 8 minutes to reach Earth. Light from the nearest star takes 4.2 years. The light we see from distant galaxies left them millions to billions of years ago.',
  2, 90);

  -- Earth Structure
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-earth-structure';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'Layers of the Earth',
  'The Earth is divided into four main layers based on composition and physical properties:

**Crust** — the thin, solid outer layer. Continental crust (30–50 km thick, less dense) and oceanic crust (5–10 km thick, more dense).

**Mantle** — extends to ~2 900 km depth. Composed of silicate rock. The upper mantle is partially molten (the **asthenosphere**), which allows tectonic plate movement.

**Outer core** — liquid iron and nickel (~2 900–5 100 km depth). Its movement generates Earth''s magnetic field.

**Inner core** — solid iron and nickel (~5 100–6 370 km depth). Despite high temperature, it is solid due to enormous pressure.',
  1, 80),
  (v_section_id, 'text', 'Evidence for Earth''s internal structure',
  'Scientists study Earth''s interior using **seismic waves** from earthquakes.

Two types of seismic waves are produced:
- **P-waves (primary waves)** — compressional waves that travel through solids and liquids
- **S-waves (secondary waves)** — shear waves that travel only through solids

By analysing where seismic waves are detected (and where they are not), scientists determined:
- The outer core is **liquid** (S-waves cannot pass through it, creating a shadow zone)
- The inner core is **solid** (P-waves travel faster through it than through liquid)

This indirect evidence, combined with analysis of meteorites (representing undifferentiated planetary material) and study of volcanic rocks, has allowed scientists to model Earth''s internal structure.',
  2, 85);

  -- Plate Tectonics
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-plate-tectonics';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'Tectonic plates and their movement',
  'Earth''s crust and upper mantle are divided into large pieces called **tectonic plates**. There are about 15 major plates and several smaller ones.

Plates move at 2–15 cm per year, driven by:
- **Convection currents** in the mantle — hot material rises, cools, and sinks
- **Ridge push** — new crust at mid-ocean ridges pushes plates apart
- **Slab pull** — dense oceanic crust sinking at subduction zones pulls plates

Evidence for plate movement:
- Matching coastlines of South America and Africa
- Similar fossils found on continents now separated by oceans
- Seafloor spreading — new crust forming at mid-ocean ridges
- Paleomagnetism — magnetic striping on the ocean floor',
  1, 85),
  (v_section_id, 'text', 'Types of plate boundaries',
  'Plates interact at three types of boundaries:

**Divergent boundaries** — plates move apart. New oceanic crust is formed (seafloor spreading). Creates mid-ocean ridges and rift valleys. Example: the Mid-Atlantic Ridge.

**Convergent boundaries** — plates move together.
- Oceanic + continental: oceanic plate subducts beneath the continental plate, forming trenches and volcanic mountain ranges. Example: the Andes.
- Continental + continental: plates crumple and fold, forming high mountain ranges. Example: the Himalayas.

**Transform boundaries** — plates slide past each other horizontally. Causes earthquakes. Example: the San Andreas Fault in California.',
  2, 90);

  -- Climate and Weather
  select id into v_section_id from curriculum_sections where slug = 'y9-sci-climate-weather';
  insert into section_cards (section_id, card_type, title, content, order_in_section, reading_time_seconds) values
  (v_section_id, 'text', 'Earth''s interconnected systems',
  'Earth can be understood as four interconnected systems:

**Lithosphere** — the solid Earth: crust and upper mantle. Includes rocks, soil, and landforms.

**Hydrosphere** — all water on Earth: oceans, rivers, lakes, ice, and water vapour.

**Atmosphere** — the layer of gases surrounding Earth: nitrogen (~78%), oxygen (~21%), and trace gases including carbon dioxide and water vapour.

**Biosphere** — all living organisms and their environments.

These systems interact continuously. For example: the water cycle (hydrosphere) transports energy (atmosphere), erodes rock (lithosphere), and sustains living things (biosphere). Carbon moves between all four systems in the **carbon cycle**.',
  1, 85),
  (v_section_id, 'text', 'The greenhouse effect and climate change',
  'The **greenhouse effect** is a natural process that warms Earth''s surface:
1. Solar radiation passes through the atmosphere and warms Earth''s surface.
2. Earth re-radiates energy as infrared radiation.
3. Greenhouse gases (CO₂, water vapour, methane) absorb and re-emit this infrared radiation, trapping heat.

Without the natural greenhouse effect, Earth''s average temperature would be about −18°C instead of +15°C.

**Enhanced greenhouse effect**: Since the Industrial Revolution, human activities (burning fossil fuels, deforestation, agriculture) have increased atmospheric CO₂ concentrations from ~280 ppm (1750) to over 420 ppm (2024). This is strengthening the greenhouse effect, causing:
- Rising global average temperatures
- More frequent extreme weather events
- Rising sea levels (from melting ice and thermal expansion of water)
- Ocean acidification',
  2, 95);

end $$;
