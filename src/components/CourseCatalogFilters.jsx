import { Search } from "lucide-react";

export default function CourseCatalogFilters({
  filterOptions,
  filters,
  onFilterChange,
  onSearchChange,
  searchText,
}) {
  return (
    <section className="card-surface toolbar-surface filter-surface">
      <div className="toolbar-title">
        <Search size={16} />
        <span>Search and refine the catalog</span>
      </div>

      <input
        type="text"
        placeholder="Search by title, code, faculty, prerequisite, or department"
        value={searchText}
        onChange={(event) => onSearchChange(event.target.value)}
        className="page-search"
      />

      <div className="filter-grid">
        <select
          value={filters.department}
          onChange={(event) => onFilterChange("department", event.target.value)}
        >
          {filterOptions.departments.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={filters.faculty}
          onChange={(event) => onFilterChange("faculty", event.target.value)}
        >
          {filterOptions.faculty.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select value={filters.day} onChange={(event) => onFilterChange("day", event.target.value)}>
          {filterOptions.days.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={filters.timeSlot}
          onChange={(event) => onFilterChange("timeSlot", event.target.value)}
        >
          {filterOptions.timeSlots.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={filters.availability}
          onChange={(event) => onFilterChange("availability", event.target.value)}
        >
          {filterOptions.availability.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
