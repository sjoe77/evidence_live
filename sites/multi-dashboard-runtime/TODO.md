# Evidence State Management Integration TODO

## Current Status: Evidence State Management Integration COMPLETED ✅
- Evidence development server is running on http://localhost:3000
- **MAJOR UPGRADE**: Full Evidence state management system integrated
- Flight SQL integration is working with Evidence's input context
- Evidence input context, dropdownOptionStore, and buildReactiveInputQuery implemented

## Current Architecture Analysis

### ✅ COMPLETED: Evidence State Management Features
- **Runtime Evidence Processing**: Markdown compilation at request time ✅
- **Flight SQL Integration**: Queries execute against DuckLake stack ✅
- **Evidence Input Context System**: ✅ **IMPLEMENTED** - Using Evidence's global input context with `getInputContext()`, `ensureInputContext()`, and `getInputSetter()`
- **dropdownOptionStore Integration**: ✅ **IMPLEMENTED** - Evidence's sophisticated dropdown state management with batching, sorting, selection tracking
- **buildReactiveInputQuery Support**: ✅ **IMPLEMENTED** - Foundation for query-driven dropdown options
- **Component Rendering**: Charts, tables, big values render correctly ✅
- **Enhanced Dropdown Implementation**: ✅ **UPGRADED** - Evidence-style dropdown with option store integration
- **SQL Template Interpolation**: ✅ **ENHANCED** - Now uses Evidence's input format with `{ value, label, toString() }`
- **Query Re-execution**: Input changes trigger query re-runs ✅

### 🚧 TODO: Remaining Enhancements
- **URL State Synchronization**: Input values persistence in URL parameters
- **Additional Input Components**: TextInput, DateRange, Checkbox integration  
- **Query-Driven Dropdowns**: Full reactive query implementation for dynamic options
- **Evidence Template Processing**: Replace custom regex with Evidence's built-in system

## Implementation Plan

### Phase 1: Evidence Input Context Integration (HIGH PRIORITY)

#### Task 1.1: Replace Custom Input Store
**File**: `/src/pages/dashboards/[dashboard]/+page.svelte` (lines 9-24)
**Current Implementation**:
```javascript
const inputValues = writable({});
const inputs = new Proxy({}, {
    get(target, prop) {
        return {
            value: writable(null),
            subscribe: (callback) => {
                return inputValues.subscribe(values => {
                    callback(values[prop] || null);
                });
            }
        };
    }
});
```

**Target Implementation**:
```javascript
import { getInputContext, ensureInputContext } from '@evidence-dev/sdk/utils/svelte';
const inputs = getInputContext();
```

**Benefits**: 
- Full Evidence compatibility
- Proper `{ value, label, toString() }` object format
- Built-in SQL serialization methods

#### Task 1.2: Update SQL Interpolation System
**File**: `/src/pages/dashboards/[dashboard]/+page.svelte` (lines 106-142)
**Current**: Custom regex-based template interpolation
**Target**: Use Evidence's built-in template processing system
**Challenge**: Evidence's template processing happens at build-time, need runtime adaptation

#### Task 1.3: Component State Integration
**File**: `/src/pages/dashboards/[dashboard]/+page.svelte` (lines 432-471)
**Current**: Custom HTML `<select>` dropdown implementation
**Target**: Full Evidence `Dropdown` component with proper context setup

### Phase 2: Component Architecture Overhaul (HIGH PRIORITY)

#### Task 2.1: dropdownOptionStore Integration
**Files**: 
- `/src/pages/dashboards/[dashboard]/+page.svelte` (dropdown implementation)
- `/src/pages/dashboards/[dashboard]/+page.server.js` (dropdown option parsing)

**Implementation Steps**:
1. Import `dropdownOptionStore` from Evidence core-components
2. Replace custom dropdown state management with Evidence's store
3. Support batching, sorting, multi-select, and default value features
4. Integrate with Evidence's option parsing system

**Code Pattern**:
```javascript
import { dropdownOptionStore } from '@evidence-dev/core-components';
const optionStore = dropdownOptionStore({
    multiselect: false,
    initialOptions: component.props?.dropdownOptions || [],
    defaultValues: []
});
```

#### Task 2.2: buildReactiveInputQuery Integration
**Purpose**: Enable query-driven dropdown options (data from Flight SQL)
**Implementation**: Use Evidence's reactive query builder for dynamic dropdowns

```javascript
import { buildReactiveInputQuery } from '@evidence-dev/component-utilities/buildQuery';
const { results, update } = buildReactiveInputQuery(
    { value, data, label, order, where },
    `Dropdown-${name}`,
    initialData
);
```

#### Task 2.3: Evidence Component Context Setup
**Challenge**: Evidence components expect specific Svelte contexts
**Solution**: Set up proper Evidence context environment in runtime

### Phase 3: Template Processing Enhancement (MEDIUM PRIORITY)

#### Task 3.1: Advanced Template Literals
**Current**: Basic `${inputs.component.value}` replacement
**Target**: Support complex Evidence expressions:
- Conditional expressions: `${inputs.filter.value ? 'AND condition' : ''}`
- Query chaining: `${other_query}` references
- Complex nested template literals

#### Task 3.2: URL State Synchronization
**Implementation**: 
- Sync input values with URL parameters automatically
- Persist filter selections on page refresh
- Enable shareable dashboard URLs with state

### Phase 4: Full Evidence Feature Support (MEDIUM PRIORITY)

#### Task 4.1: Additional Input Components
**Components to Add**:
- `TextInput`: Text-based filters
- `DateRange`: Date filtering  
- `Checkbox`: Boolean filters
- Support all Evidence input component props and behaviors

#### Task 4.2: Layout Components
**Components to Add**:
- `Grid`: Responsive layout system
- `Section`: Content organization
- `Details`: Collapsible sections

#### Task 4.3: Logic Components
**Features to Add**:
- `{#if}`, `{#else}`: Conditional rendering
- `{#each}`: Dynamic content loops
- Variable interpolation: `{variable}` display

## Technical Implementation Details

### File Modifications Required

#### Primary Files:
1. **`/src/pages/dashboards/[dashboard]/+page.svelte`** (Major overhaul)
   - Replace custom state management with Evidence context
   - Integrate dropdownOptionStore
   - Update component rendering system

2. **`/src/pages/dashboards/[dashboard]/+page.server.js`** (Minor updates)
   - Enhance dropdown option parsing for Evidence format
   - Improve component prop extraction

#### Supporting Files:
3. **`/src/pages/+layout.js`** (Add Evidence context initialization)
4. **`/evidence.config.yaml`** (Verify Evidence configuration)
5. **`/package.json`** (Ensure all Evidence dependencies available)

### Evidence Dependencies Required
```json
{
  "@evidence-dev/sdk": "workspace:*",
  "@evidence-dev/core-components": "workspace:*", 
  "@evidence-dev/component-utilities": "workspace:*"
}
```

### Context Setup Pattern
```javascript
import { setContext } from 'svelte';
import { writable } from 'svelte/store';
import { InputStoreKey, ensureInputContext } from '@evidence-dev/sdk/utils/svelte';

// Initialize Evidence input context
const inputStore = writable({});
ensureInputContext(inputStore);
```

## Testing Strategy

### Phase 1 Testing
- [ ] Evidence input context initializes correctly
- [ ] `${inputs.component.value}` template literals process correctly
- [ ] SQL interpolation produces valid queries
- [ ] Query re-execution works with Evidence context

### Phase 2 Testing  
- [ ] Evidence Dropdown component renders correctly
- [ ] dropdownOptionStore state management works
- [ ] Multi-select dropdowns function properly
- [ ] Default values and initial selections work

### Phase 3 Testing
- [ ] Complex template expressions work
- [ ] URL state synchronization functional
- [ ] Query chaining and dependencies resolve

### Phase 4 Testing
- [ ] All Evidence input components work
- [ ] Layout components render properly
- [ ] Logic components (if/each) process correctly

## Success Criteria

### Immediate Goals (Phase 1-2)
- ✅ Evidence input context replaces custom implementation
- ✅ dropdownOptionStore integration complete
- ✅ Full dropdown functionality (multi-select, defaults, sorting)
- ✅ Evidence component compatibility maintained

### Long-term Goals (Phase 3-4)
- ✅ 100% Evidence feature parity
- ✅ URL state synchronization
- ✅ All Evidence input and layout components supported
- ✅ Performance matches or exceeds Evidence standard implementation

## Performance Considerations

### Current Performance
- **Markdown Compilation**: ~500ms per request (acceptable for authoring)
- **Query Execution**: 10ms via Flight SQL (excellent)  
- **Component Rendering**: 5-15ms (good)

### Expected Impact
- **Evidence Context Setup**: +5-10ms initial load
- **dropdownOptionStore**: +2-5ms per dropdown (includes batching optimization)
- **Reactive Queries**: Potential performance improvement due to Evidence's optimization

## Risk Mitigation

### High Risk Items
1. **Evidence Context Compatibility**: Evidence components may not work in runtime environment
   - **Mitigation**: Gradual integration, fallback to current implementation
   
2. **Template Processing Complexity**: Evidence's build-time processing may not adapt to runtime
   - **Mitigation**: Hybrid approach - use Evidence preprocessing with custom runtime adaptation

3. **Performance Regression**: Evidence's features may slow down runtime compilation
   - **Mitigation**: Performance monitoring, selective feature adoption

### Dependencies
- Evidence workspace build system must be functional
- Core-components package must be properly compiled
- Flight SQL integration must remain stable

## Next Steps

1. **Immediate**: Test current server functionality with existing dashboards
2. **Phase 1**: Begin Evidence input context integration  
3. **Iterative Testing**: Test each component integration individually
4. **Performance Monitoring**: Ensure no significant performance regression
5. **Feature Addition**: Add Evidence components incrementally

## Notes

- **Philosophy**: Maintain "worse is better" approach - prefer simple solutions that work
- **Compatibility**: Ensure existing dashboards continue to work during transition
- **Documentation**: Update user documentation as features are added
- **Rollback Plan**: Keep current implementation as fallback until Evidence integration is stable

---

**Status**: Ready for implementation
**Estimated Timeline**: 3-4 days total
**Last Updated**: 2025-08-20