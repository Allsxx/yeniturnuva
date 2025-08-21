import React from "react";

const PuanTablosu = ({ tablo }) => (
  <div className="elemination-winner-box" >
    <h3 className="elemination-title" >Puan Tablosu</h3>
    <table className="lig-standings-table" >
      <thead>
        <tr>
          <th>#</th>
          <th>Takım</th>
          <th>O</th>
          <th>G</th>
          <th>B</th>
          <th>M</th>
          <th>A</th>
          <th>Y</th>
          <th>AV</th>
          <th>P</th>
        </tr>
      </thead>
      <tbody>
        {tablo.map((row, idx) => (
          <tr key={row.name}>
            <td>{idx + 1}</td>
            <td>{row.name}</td>
            <td>{row.O}</td>
            <td>{row.G}</td>
            <td>{row.B}</td>
            <td>{row.M}</td>
            <td>{row.A}</td>
            <td>{row.Y}</td>
            <td>{row.AV}</td>
            <td>{row.P}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default PuanTablosu;